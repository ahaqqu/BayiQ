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

export type Bilingual = { id: string; en: string };

export type Vaccine = {
  id: string;
  color: string;
  name: Bilingual;
  prevents: Bilingual;
  doseIds: string[];
};

export type ScheduleDose = DoseRef & { doseId: string };

export type ScheduleVaccine = Omit<Vaccine, "doseIds"> & {
  doses: ScheduleDose[];
};

export const VACCINES: Vaccine[] = [
  {
    id: "hepb",
    color: "#F3D3E0",
    name: { id: "Hepatitis B", en: "Hepatitis B" },
    prevents: {
      id: "Mencegah penyakit hepatitis B yang dapat menyebabkan kerusakan hati dan kanker.",
      en: "Prevents hepatitis B disease, which can cause liver damage and cancer.",
    },
    doseIds: ["hepb-birth"],
  },
  {
    id: "bcg",
    color: "#D2EAD9",
    name: { id: "BCG", en: "BCG" },
    prevents: {
      id: "Mencegah TBC (tuberkulosis) paru dan komplikasi serius seperti TBC tulang dan radang otak.",
      en: "Prevents pulmonary TB (tuberculosis) and serious complications such as bone TB and meningitis.",
    },
    doseIds: ["bcg-1mo"],
  },
  {
    id: "polio",
    color: "#F6D8CE",
    name: { id: "Polio", en: "Polio" },
    prevents: {
      id: "Mencegah polio, virus yang menyerang otak dan sumsum tulang belakang yang dapat menyebabkan kelumpuhan pada kaki.",
      en: "Prevents polio, a virus that attacks the brain and spinal cord and can cause leg paralysis.",
    },
    doseIds: ["polio-2mo", "polio-3mo", "polio-4mo", "polio-6mo"],
  },
  {
    id: "dpt",
    color: "#F8E2C9",
    name: { id: "DPT", en: "DPT" },
    prevents: {
      id: "Mencegah difteri (infeksi hidung dan tenggorokan yang menyebabkan kesulitan bernapas), pertusis (batuk rejan), dan tetanus (kejang otot rahang dan leher).",
      en: "Prevents diphtheria (nose and throat infection causing breathing difficulty), pertussis (whooping cough), and tetanus (jaw and neck muscle spasms).",
    },
    doseIds: ["dpt-2mo", "dpt-3mo", "dpt-4mo"],
  },
  {
    id: "campak",
    color: "#EBDAEE",
    name: { id: "Campak", en: "Measles" },
    prevents: {
      id: "Mencegah penyakit campak (demam, ruam merah) dan rubela atau campak jerman, dapat menyebabkan infeksi telinga, pneumonia, kejang, kerusakan otak dan kematian.",
      en: "Prevents measles (fever, red rash) and rubella (German measles), which can cause ear infection, pneumonia, seizures, brain damage, and death.",
    },
    doseIds: ["campak-9mo", "campak-18mo", "campak-72mo"],
  },
  {
    id: "hib",
    color: "#F7EBC9",
    name: { id: "Hib", en: "Hib" },
    prevents: {
      id: "Mencegah penyakit akibat kuman Hib seperti radang otak (meningitis), infeksi darah (sepsis), radang paru (pneumonia), radang katup napas (epiglotitis).",
      en: "Prevents diseases caused by Hib bacteria such as meningitis, blood infection (sepsis), pneumonia, and epiglottitis.",
    },
    doseIds: ["hib-2mo", "hib-3mo", "hib-4mo"],
  },
  {
    id: "pcv",
    color: "#F3D3E0",
    name: { id: "PCV", en: "PCV" },
    prevents: {
      id: "Mencegah penyakit akibat infeksi kuman Pneumokokus, seperti pneumonia, meningitis dan infeksi darah (sepsis).",
      en: "Prevents diseases caused by pneumococcal infection, such as pneumonia, meningitis, and blood infection (sepsis).",
    },
    doseIds: ["pcv-2mo", "pcv-3mo", "pcv-12mo"],
  },
  {
    id: "rotavirus",
    color: "#D2EAD9",
    name: { id: "Rotavirus", en: "Rotavirus" },
    prevents: {
      id: "Mencegah diare akut (muntah dan buang air besar encer yang hebat).",
      en: "Prevents acute diarrhea (severe vomiting and watery stools).",
    },
    doseIds: ["rotavirus-2mo", "rotavirus-3mo", "rotavirus-4mo"],
  },
  {
    id: "influenza",
    color: "#F6D8CE",
    name: { id: "Influenza", en: "Influenza" },
    prevents: {
      id: "Mencegah infeksi virus Influenza (demam, batuk, pilek disertai nyeri otot). Diulang setiap tahun.",
      en: "Prevents influenza virus infection (fever, cough, runny nose with muscle aches). Repeated every year.",
    },
    doseIds: [
      "influenza-6mo",
      "influenza-12mo",
      "influenza-24mo",
      "influenza-36mo",
      "influenza-48mo",
      "influenza-60mo",
      "influenza-72mo",
      "influenza-84mo",
      "influenza-96mo",
      "influenza-108mo",
      "influenza-120mo",
      "influenza-132mo",
      "influenza-144mo",
      "influenza-156mo",
      "influenza-168mo",
      "influenza-180mo",
      "influenza-192mo",
      "influenza-204mo",
      "influenza-216mo",
    ],
  },
  {
    id: "dengue",
    color: "#F8E2C9",
    name: { id: "Dengue (DBV)", en: "Dengue (DBV)" },
    prevents: {
      id: "Mencegah demam berdarah dengue (DBD).",
      en: "Prevents dengue hemorrhagic fever (DHF).",
    },
    doseIds: ["dengue-12mo", "dengue-18mo", "dengue-24mo"],
  },
  {
    id: "je",
    color: "#EBDAEE",
    name: { id: "Japanese Encephalitis (TBE)", en: "Japanese Encephalitis (TBE)" },
    prevents: {
      id: "Mencegah penyakit akibat virus Japanese encephalitis yang ditularkan melalui gigitan nyamuk, dapat menyebabkan radang otak.",
      en: "Prevents disease caused by the Japanese encephalitis virus, transmitted through mosquito bites, which can cause brain inflammation.",
    },
    doseIds: ["je-12mo", "je-18mo"],
  },
  {
    id: "tipoid",
    color: "#F7EBC9",
    name: { id: "Tipoid", en: "Typhoid" },
    prevents: {
      id: "Mencegah penyakit tifoid atau demam tifoid (\"tipes\") yang disebabkan infeksi bakteri Salmonella typhi. Diulang setiap 3 tahun.",
      en: "Prevents typhoid fever caused by Salmonella typhi bacterial infection. Repeated every 3 years.",
    },
    doseIds: ["tipoid-36mo", "tipoid-72mo", "tipoid-108mo", "tipoid-144mo", "tipoid-180mo", "tipoid-216mo"],
  },
  {
    id: "hepa",
    color: "#F3D3E0",
    name: { id: "Hepatitis A", en: "Hepatitis A" },
    prevents: {
      id: "Mencegah penyakit hepatitis A (infeksi hati yang sangat menular).",
      en: "Prevents hepatitis A (a highly contagious liver infection).",
    },
    doseIds: ["hepa-24mo", "hepa-36mo"],
  },
  {
    id: "varisela",
    color: "#D2EAD9",
    name: { id: "Varisela", en: "Varicella" },
    prevents: {
      id: "Mencegah penyakit cacar air (demam disertai ruam lepuhan berisi air di seluruh badan yang dapat menimbulkan bekas luka permanen).",
      en: "Prevents chickenpox (fever with fluid-filled blisters all over the body that can leave permanent scars).",
    },
    doseIds: ["varisela-36mo", "varisela-48mo"],
  },
  {
    id: "mmr",
    color: "#F6D8CE",
    name: { id: "MMR", en: "MMR" },
    prevents: {
      id: "Mencegah penyakit gondongan (pembengkakan kelenjar ludah di bawah telinga, dapat menyebabkan radang otak, tuli, radang testis/ovarium), campak (measles) dan rubela (campak jerman).",
      en: "Prevents mumps (swelling of salivary glands below the ears, can cause brain inflammation, deafness, testicular/ovarian inflammation), measles, and rubella (German measles).",
    },
    doseIds: ["mmr-12mo", "mmr-72mo"],
  },
  {
    id: "td",
    color: "#F8E2C9",
    name: { id: "Td", en: "Td" },
    prevents: {
      id: "Vaksin Td (Tetanus difteria) untuk melengkapi dosis vaksin DPT sebelumnya.",
      en: "Td vaccine (Tetanus diphtheria) to complete the previous DPT vaccine doses.",
    },
    doseIds: ["td-84mo", "td-96mo", "td-108mo"],
  },
  {
    id: "hpv",
    color: "#EBDAEE",
    name: { id: "HPV", en: "HPV" },
    prevents: {
      id: "Mencegah kanker serviks pada wanita.",
      en: "Prevents cervical cancer in women.",
    },
    doseIds: ["hpv-60mo", "hpv-72mo"],
  },
  {
    id: "covid",
    color: "#F7EBC9",
    name: { id: "Covid-19", en: "Covid-19" },
    prevents: {
      id: "Mencegah infeksi virus Covid-19.",
      en: "Prevents Covid-19 virus infection.",
    },
    doseIds: ["covid-72mo", "covid-84mo"],
  },
];

/** Full schedule: vaccine metadata joined with the canonical dose map. */
export const SCHEDULE: ScheduleVaccine[] = VACCINES.map((v) => ({
  id: v.id,
  color: v.color,
  name: v.name,
  prevents: v.prevents,
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
