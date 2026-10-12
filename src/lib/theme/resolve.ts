// the pure var(--token) resolver: walks a style-shaped value and swaps
// var(--token) strings for the theme's concrete colors. zero react-native
// imports so the suite can test it directly.

export type TokenLookup = Record<string, string | undefined>;

// walk a style object and swap var(--token) strings for the theme's colors.
// the output keeps the exact shape of the input, so the callee's assertion
// back to T is grounded in the walker, not in any widening.
export function resolveTokens<T>(value: T, tokens: TokenLookup): T {
  if (typeof value === "string") {
    // SAFETY: resolveString substitutes var(--token) text fragments in
    // place; a style's string leaf keeps its string identity and type.
    return resolveString(value, tokens) as T;
  }
  if (Array.isArray(value)) {
    // SAFETY: map preserves the array length and element positions, so an
    // array-typed style value keeps the exact shape T describes.
    return value.map((v) => resolveTokens(v, tokens)) as T;
  }
  if (typeof value === "object" && value !== null) {
    // SAFETY: fromEntries rebuilds an object with every key/value pair of
    // the input, so the resolved style keeps the T shape; only the color
    // strings inside it change.
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, entry]) => [key, resolveTokens(entry, tokens)] as const,
      ),
    ) as T;
  }
  return value;
}

export function resolveString(input: string, tokens: TokenLookup): string {
  if (input.indexOf("var(") === -1) return input;
  let out = "";
  let i = 0;
  while (i < input.length) {
    const idx = input.indexOf("var(", i);
    if (idx === -1) {
      out += input.slice(i);
      break;
    }
    out += input.slice(i, idx);
    const parsed = readVar(input, idx);
    if (!parsed) {
      out += input.slice(idx);
      break;
    }
    const token = tokens[parsed.name];
    if (token !== undefined) {
      out += token;
    } else if (parsed.fallback !== undefined) {
      out += resolveString(parsed.fallback, tokens);
    } else {
      out += `var(${parsed.name})`;
    }
    i = parsed.end;
  }
  return out;
}

function readVar(
  input: string,
  start: number,
): { name: string; fallback?: string; end: number } | null {
  let j = start + 4;
  let name = "";
  while (j < input.length && input[j] !== "," && input[j] !== ")") {
    name += input[j];
    j++;
  }
  name = name.trim();
  if (j >= input.length) return null;
  if (input[j] === ")") return { name, end: j + 1 };
  j++;
  const fallbackStart = j;
  let depth = 1;
  while (j < input.length) {
    const ch = input[j];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) break;
    }
    j++;
  }
  return { name, fallback: input.slice(fallbackStart, j).trim(), end: j + 1 };
}
