import type { BayiQStore } from "./store";
import { isoLocal } from "./date";

/**
 * First-class onboarding path (spec §Web app): a 5-month-old child with
 * several pre-filled records, mirroring the prototype's sample data.
 */
export async function loadSampleData(store: BayiQStore): Promise<string> {
  const dob = new Date();
  dob.setDate(1);
  dob.setMonth(dob.getMonth() - 5);
  const childRow = await store.upsertChild({
    name: "Aisha",
    dateOfBirth: isoLocal(dob),
    sex: "female",
  });
  const at = (monthsAgo: number) => {
    const d = new Date(dob);
    d.setDate(1);
    d.setMonth(d.getMonth() + monthsAgo);
    return isoLocal(d);
  };
  const samples: [string, string, string | undefined, string | undefined][] = [
    ["hepb-birth", at(0), "Engerix-B", undefined],
    ["bcg-1mo", at(1), "BCG Biofarma", undefined],
    ["polio-2mo", at(2), undefined, "OPV tetes"],
    ["dpt-2mo", at(2), "Pentabio", undefined],
    ["hib-2mo", at(2), "Pentabio", undefined],
    ["pcv-2mo", at(2), "Prevenar 13", undefined],
    ["rotavirus-2mo", at(2), "Rotarix", undefined],
    ["polio-3mo", at(3), undefined, undefined],
    ["dpt-3mo", at(3), "Pentabio", undefined],
    ["hib-3mo", at(3), "Pentabio", undefined],
    ["pcv-3mo", at(3), "Prevenar 13", undefined],
    ["rotavirus-3mo", at(3), "Rotarix", undefined],
  ];
  for (const [doseId, givenDate, brand, note] of samples) {
    await store.upsertRecord({
      childId: childRow.childId,
      doseId,
      givenDate,
      brand,
      note,
    });
  }
  return childRow.childId;
}
