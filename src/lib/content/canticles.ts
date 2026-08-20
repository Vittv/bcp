import { canticlesSchema } from "./schemas";
import type { CanticlePassage, CanticleSection } from "./types";
import canticlesData from "./vendor/bcp/canticles.min.json";

const canticles = canticlesSchema.parse(canticlesData);

export function canticleExists(number: number): boolean {
  return Object.hasOwn(canticles, String(number));
}

export function canticleTitle(number: number): string | undefined {
  return canticles[String(number)]?.title;
}

// the Benedicite (canticles 1 and 12) note: whatever the selection, it
// begins with the Invocation and concludes with the Doxology.
function isBenedicite(canticle: Canticle): boolean {
  const first = canticle.sections[0]?.title;
  const last = canticle.sections[canticle.sections.length - 1]?.title;
  return Boolean(first?.includes("Invocation") && last?.includes("Doxology"));
}

// render the selected canticle, optionally clipped to a range of sections.
// an unqualified citation yields the whole canticle.
export function canticlePassage(
  number: number,
  sectionRange?: { start: number; end?: number },
): CanticlePassage | undefined {
  const canticle = canticles[String(number)];
  if (!canticle) return undefined;
  let sections: CanticleSection[];
  if (!sectionRange) {
    sections = canticle.sections;
  } else {
    const start = Math.max(0, sectionRange.start);
    const end = Math.min(
      canticle.sections.length - 1,
      sectionRange.end ?? sectionRange.start,
    );
    let selected = canticle.sections.slice(start, end + 1);
    if (isBenedicite(canticle)) {
      if (start > 0) selected = [canticle.sections[0], ...selected];
      if (end < canticle.sections.length - 1) {
        selected = [
          ...selected,
          canticle.sections[canticle.sections.length - 1],
        ];
      }
    }
    sections = selected;
  }
  return { number, title: canticle.title, sections };
}
