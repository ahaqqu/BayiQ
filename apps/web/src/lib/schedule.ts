import { AGE_MONTHS, DOSE_MAP, type DoseRef } from "@app/contracts";
import { t, type Locale, type Messages } from "./i18n";
import { today } from "./date";
export { today };

/**
 * Full IDAI 2024 schedule (ADR-002, ADR-008): vaccine metadata (bilingual
 * name, color, explanation) plus the ordered dose references. Dose identity
 * comes from the canonical dose map in `@app/contracts` — this module only
 * adds presentation data, so the two can never drift.
 */

export type Vaccine = {
  id: string;
  color: string;
  nameKey: string;
  preventsKey: string;
  doseIds: string[];
};

export type ScheduleDose = DoseRef & { doseId: string };

export type ScheduleVaccine = Omit<Vaccine, "doseIds"> & {
  doses: ScheduleDose[];
};

export const VACCINES: Vaccine[] = [
  { id: "hepb", color: "#F3D3E0", nameKey: "vaccine.hepb.name", preventsKey: "vaccine.hepb.prevents", doseIds: ["hepb-birth"] },
  { id: "bcg", color: "#D2EAD9", nameKey: "vaccine.bcg.name", preventsKey: "vaccine.bcg.prevents", doseIds: ["bcg-1mo"] },
  { id: "polio", color: "#F6D8CE", nameKey: "vaccine.polio.name", preventsKey: "vaccine.polio.prevents", doseIds: ["polio-2mo", "polio-3mo", "polio-4mo", "polio-6mo"] },
  { id: "dpt", color: "#F8E2C9", nameKey: "vaccine.dpt.name", preventsKey: "vaccine.dpt.prevents", doseIds: ["dpt-2mo", "dpt-3mo", "dpt-4mo"] },
  { id: "campak", color: "#EBDAEE", nameKey: "vaccine.campak.name", preventsKey: "vaccine.campak.prevents", doseIds: ["campak-9mo", "campak-18mo", "campak-72mo"] },
  { id: "hib", color: "#F7EBC9", nameKey: "vaccine.hib.name", preventsKey: "vaccine.hib.prevents", doseIds: ["hib-2mo", "hib-3mo", "hib-4mo"] },
  { id: "pcv", color: "#F3D3E0", nameKey: "vaccine.pcv.name", preventsKey: "vaccine.pcv.prevents", doseIds: ["pcv-2mo", "pcv-3mo", "pcv-12mo"] },
  { id: "rotavirus", color: "#D2EAD9", nameKey: "vaccine.rotavirus.name", preventsKey: "vaccine.rotavirus.prevents", doseIds: ["rotavirus-2mo", "rotavirus-3mo", "rotavirus-4mo"] },
  { id: "influenza", color: "#F6D8CE", nameKey: "vaccine.influenza.name", preventsKey: "vaccine.influenza.prevents", doseIds: ["influenza-6mo", "influenza-12mo", "influenza-24mo", "influenza-36mo", "influenza-48mo", "influenza-60mo", "influenza-72mo", "influenza-84mo", "influenza-96mo", "influenza-108mo", "influenza-120mo", "influenza-132mo", "influenza-144mo", "influenza-156mo", "influenza-168mo", "influenza-180mo", "influenza-192mo", "influenza-204mo", "influenza-216mo"] },
  { id: "dengue", color: "#F8E2C9", nameKey: "vaccine.dengue.name", preventsKey: "vaccine.dengue.prevents", doseIds: ["dengue-12mo", "dengue-18mo", "dengue-24mo"] },
  { id: "je", color: "#EBDAEE", nameKey: "vaccine.je.name", preventsKey: "vaccine.je.prevents", doseIds: ["je-12mo", "je-18mo"] },
  { id: "tipoid", color: "#F7EBC9", nameKey: "vaccine.tipoid.name", preventsKey: "vaccine.tipoid.prevents", doseIds: ["tipoid-36mo", "tipoid-72mo", "tipoid-108mo", "tipoid-144mo", "tipoid-180mo", "tipoid-216mo"] },
  { id: "hepa", color: "#F3D3E0", nameKey: "vaccine.hepa.name", preventsKey: "vaccine.hepa.prevents", doseIds: ["hepa-24mo", "hepa-36mo"] },
  { id: "varisela", color: "#D2EAD9", nameKey: "vaccine.varisela.name", preventsKey: "vaccine.varisela.prevents", doseIds: ["varisela-36mo", "varisela-48mo"] },
  { id: "mmr", color: "#F6D8CE", nameKey: "vaccine.mmr.name", preventsKey: "vaccine.mmr.prevents", doseIds: ["mmr-12mo", "mmr-72mo"] },
  { id: "td", color: "#F8E2C9", nameKey: "vaccine.td.name", preventsKey: "vaccine.td.prevents", doseIds: ["td-84mo", "td-96mo", "td-108mo"] },
  { id: "hpv", color: "#EBDAEE", nameKey: "vaccine.hpv.name", preventsKey: "vaccine.hpv.prevents", doseIds: ["hpv-60mo", "hpv-72mo"] },
  { id: "covid", color: "#F7EBC9", nameKey: "vaccine.covid.name", preventsKey: "vaccine.covid.prevents", doseIds: ["covid-72mo", "covid-84mo"] },
];

/** Full schedule: vaccine metadata joined with the canonical dose map. */
export const SCHEDULE: ScheduleVaccine[] = VACCINES.map((v) => ({
  id: v.id,
  color: v.color,
  nameKey: v.nameKey,
  preventsKey: v.preventsKey,
  doses: v.doseIds.map((doseId) => {
    const ref = DOSE_MAP[doseId];
    if (!ref) throw new Error(`schedule: unknown doseId ${doseId}`);
    return { ...ref, doseId };
  }),
}));

export const AGE_COLUMNS: { months: number }[] = AGE_MONTHS.map((months) => ({
  months,
}));

/** Format an age column label for the given locale using i18n messages. */
export function ageColumnLabel(
  messages: Messages,
  locale: Locale,
  months: number,
): string {
  if (months === 0) return t(messages, "ageBirth");
  if (months < 24) return `${months} ${t(messages, "ageMonth")}`;
  return `${Math.floor(months / 12)} ${t(messages, "ageYear")}`;
}

export function findVaccine(vaccineId: string): ScheduleVaccine | undefined {
  return SCHEDULE.find((v) => v.id === vaccineId);
}

/** Resolve a doseId to its vaccine and dose, or undefined. */
export function findDoseById(
  doseId: string,
): { vaccine: ScheduleVaccine; dose: ScheduleDose } | undefined {
  for (const vaccine of SCHEDULE) {
    const dose = vaccine.doses.find((d) => d.doseId === doseId);
    if (dose) return { vaccine, dose };
  }
  return undefined;
}
