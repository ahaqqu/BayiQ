import { useState } from "react";
import type { ChildRow, RecordRow } from "@app/local-first";
import { formatAge, t, useLocale } from "../lib/i18n";
import { ageColumnLabel, findVaccine, today } from "../lib/schedule";
import { Button, Input, Modal, StatusBadge, Textarea, type DoseStatus } from "./index";

/** Dose detail modal: status, explanation, and the record form. */
export function DoseModal({
  child,
  vaccineId,
  doseId,
  record,
  status,
  childAgeMonths,
  onSave,
  onDelete,
  onClose,
}: {
  child: ChildRow;
  vaccineId: string;
  doseId: string;
  record?: RecordRow | undefined;
  status: DoseStatus;
  childAgeMonths: number;
  onSave: (input: {
    givenDate: string;
    brand?: string | undefined;
    note?: string | undefined;
  }) => void;
  onDelete: (recordId: string) => void;
  onClose: () => void;
}) {
  const { locale, messages } = useLocale();
  const vaccine = findVaccine(vaccineId);
  const dose = vaccine?.doses.find((d) => d.doseId === doseId);
  const [givenDate, setGivenDate] = useState(record?.givenDate ?? today());
  const [brand, setBrand] = useState(record?.brand ?? "");
  const [note, setNote] = useState(record?.note ?? "");

  if (!vaccine || !dose) return null;

  const ageLabel = ageColumnLabel(messages, locale, dose.months);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!givenDate) return;
    onSave({
      givenDate,
      brand: brand.trim() === "" ? undefined : brand.trim(),
      note: note.trim() === "" ? undefined : note.trim(),
    });
  };

  return (
    <Modal title={`${vaccine.name[locale]} — ${dose.code}`} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: vaccine.color }}
          >
            {vaccine.name[locale]}
          </span>
          <span className="text-sm font-semibold">{dose.code}</span>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-slate-400">
          {t(messages, "scheduledAt")}: {ageLabel} · {child.name} (
          {formatAge(messages, childAgeMonths)})
        </p>
        {dose.repeat && (
          <p className="text-xs text-slate-500">{t(messages, "repeatYearly")}</p>
        )}
        <div>
          <h4 className="mb-1 text-sm font-semibold">
            {t(messages, "explanation")}
          </h4>
          <p className="text-sm text-slate-300">{vaccine.prevents[locale]}</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            {t(messages, "givenOn")}
            <Input
              data-testid="record-date"
              type="date"
              value={givenDate}
              required
              max={today()}
              onChange={(e) => setGivenDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            {t(messages, "brand")}
            <Input
              data-testid="record-brand"
              placeholder={t(messages, "brandPlaceholder")}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            {t(messages, "note")}
            <Textarea
              data-testid="record-note"
              rows={2}
              placeholder={t(messages, "notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            {record && (
              <Button
                type="button"
                variant="danger"
                data-testid="record-delete"
                onClick={() => onDelete(record.recordId)}
              >
                {t(messages, "deleteRecord")}
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onClose}>
              {t(messages, "cancel")}
            </Button>
            <Button type="submit" data-testid="record-save">
              {t(messages, record ? "updateRecord" : "markDone")}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
