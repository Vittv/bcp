import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ROOT = join(import.meta.dir, "..");

export function projectPath(...parts: string[]): string {
  return join(ROOT, ...parts);
}

export async function readProjectText(...parts: string[]): Promise<string> {
  return readFile(projectPath(...parts), "utf8");
}

export async function readProjectJson<T>(...parts: string[]): Promise<T> {
  const source = await readProjectText(...parts);
  // SAFETY: callers read known project JSON files and validate the fields they use.
  return JSON.parse(source) as T;
}

export async function readPackageVersion(): Promise<string> {
  const pkg = await readProjectJson<{ version: string }>("package.json");
  return pkg.version;
}
