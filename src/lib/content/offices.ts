import { officesSchema } from "./schemas";
import type { Office, OfficeId, OfficeSection } from "./types";
import officesData from "./vendor/bcp/offices.min.json";

const offices = officesSchema.parse(officesData);

const ORDER: OfficeId[] = [
  "morning-rite-one",
  "morning-rite-two",
  "evening-rite-one",
  "evening-rite-two",
  "noonday",
  "owe",
  "compline",
];

export function officeExists(id: OfficeId): boolean {
  return Object.hasOwn(offices, id);
}

// the full text of an office, in printed order.
export function office(id: OfficeId): Office | undefined {
  return offices[id];
}

// the offices with their sections, in printed order.
export function officeList(): Office[] {
  return ORDER.map((id) => offices[id]);
}

// the sections of an office, in printed order.
export function officeSections(id: OfficeId): OfficeSection[] {
  return offices[id]?.sections ?? [];
}

export function officeSection(
  id: OfficeId,
  key: OfficeSection["key"],
): OfficeSection | undefined {
  return offices[id]?.sections.find((section) => section.key === key);
}
