import * as v from "valibot";

/**
 * Canonical IDAI 2024 dose map (ADR-002, ADR-008). The single source of
 * truth for dose identity: every Record references a `doseId` from this map,
 * and the web schedule is built from it. Compiled from `prototype/js/data.js`.
 */

export const DoseRefSchema = v.object({
  vaccineId: v.pipe(v.string(), v.minLength(1)),
  months: v.pipe(v.number(), v.integer(), v.minValue(0)),
  code: v.pipe(v.string(), v.minLength(1)),
  repeat: v.boolean(),
});

export type DoseRef = v.InferOutput<typeof DoseRefSchema>;

/** The 26 age columns of the IDAI 2024 poster, in months. */
export const AGE_MONTHS = [
  0, 1, 2, 3, 4, 6, 9, 12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132,
  144, 156, 168, 180, 192, 204, 216,
] as const;

const slug = (months: number): string => (months === 0 ? "birth" : `${months}mo`);

function dose(
  vaccineId: string,
  months: number,
  code: string,
  repeat = false,
): [string, DoseRef] {
  return [`${vaccineId}-${slug(months)}`, { vaccineId, months, code, repeat }];
}

/** Repeat instances: every age column at/after `start` with step `step`. */
function yearly(
  vaccineId: string,
  start: number,
  step: number,
): [string, DoseRef][] {
  return AGE_MONTHS.filter(
    (m) => m >= start && (m - start) % step === 0,
  ).map((m) => dose(vaccineId, m, "→", true));
}

export const DOSE_MAP: Record<string, DoseRef> = Object.fromEntries([
  dose("hepb", 0, "HB-0"),
  dose("bcg", 1, "BCG"),
  dose("polio", 2, "OPV 1"),
  dose("polio", 3, "OPV 2"),
  dose("polio", 4, "OPV 3"),
  dose("polio", 6, "OPV 4 / IPV"),
  dose("dpt", 2, "DPT 1"),
  dose("dpt", 3, "DPT 2"),
  dose("dpt", 4, "DPT 3"),
  dose("campak", 9, "Campak 1 / MR"),
  dose("campak", 18, "Campak 2"),
  dose("campak", 72, "Campak 3 / MR"),
  dose("hib", 2, "Hib 1"),
  dose("hib", 3, "Hib 2"),
  dose("hib", 4, "Hib 3"),
  dose("pcv", 2, "PCV 1"),
  dose("pcv", 3, "PCV 2"),
  dose("pcv", 12, "PCV 3"),
  dose("rotavirus", 2, "RV 1"),
  dose("rotavirus", 3, "RV 2"),
  dose("rotavirus", 4, "RV 3"),
  dose("influenza", 6, "Influenza"),
  ...yearly("influenza", 12, 12),
  dose("dengue", 12, "DBV 1"),
  dose("dengue", 18, "DBV 2"),
  dose("dengue", 24, "DBV 3"),
  dose("je", 12, "TBE 1"),
  dose("je", 18, "TBE 2"),
  dose("tipoid", 36, "Tipoid 1"),
  ...yearly("tipoid", 72, 36),
  dose("hepa", 24, "HepA 1"),
  dose("hepa", 36, "HepA 2"),
  dose("varisela", 36, "Varisela 1"),
  dose("varisela", 48, "Varisela 2"),
  dose("mmr", 12, "MMR 1"),
  dose("mmr", 72, "MMR 2"),
  dose("td", 84, "Td 1"),
  dose("td", 96, "Td 2"),
  dose("td", 108, "Td 3"),
  dose("hpv", 60, "HPV 1"),
  dose("hpv", 72, "HPV 2"),
  dose("covid", 72, "Covid-19"),
  dose("covid", 84, "→", true),
]);
