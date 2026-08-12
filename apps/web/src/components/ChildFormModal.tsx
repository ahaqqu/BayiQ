import { useState } from "react";
import type { ChildRow } from "@app/local-first";
import { t, useLocale } from "../lib/i18n";
import { today } from "../lib/date";
import { Button, Input, Modal } from "./ui";

/** Add/edit child form (name, date of birth, optional sex). */
export function ChildFormModal({
  child,
  onSave,
  onClose,
}: {
  child?: ChildRow | undefined;
  onSave: (input: {
    name: string;
    dateOfBirth: string;
    sex?: "male" | "female" | undefined;
  }) => void;
  onClose: () => void;
}) {
  const { messages } = useLocale();
  const [name, setName] = useState(child?.name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(child?.dateOfBirth ?? "");
  const [sex, setSex] = useState<"" | "male" | "female">(child?.sex ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dateOfBirth) return;
    onSave({
      name: name.trim(),
      dateOfBirth,
      sex: sex === "" ? undefined : sex,
    });
  };

  return (
    <Modal
      title={t(messages, child ? "editChild" : "addChild")}
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          {t(messages, "childName")}
          <Input
            data-testid="child-name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          {t(messages, "dob")}
          <Input
            data-testid="child-dob"
            type="date"
            value={dateOfBirth}
            required
            max={today()}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          {t(messages, "sex")}
          <select
            data-testid="child-sex"
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
            value={sex}
            onChange={(e) => setSex(e.target.value as "" | "male" | "female")}
          >
            <option value="">—</option>
            <option value="male">{t(messages, "male")}</option>
            <option value="female">{t(messages, "female")}</option>
          </select>
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t(messages, "cancel")}
          </Button>
          <Button type="submit" data-testid="child-save">
            {t(messages, "save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
