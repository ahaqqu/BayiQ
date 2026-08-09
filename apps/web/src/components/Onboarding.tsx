import { t, useLocale } from "../lib/i18n";
import { Button, Card } from "./ui";

/** Empty state when no child exists yet: add child or load sample data. */
export function Onboarding({
  onAdd,
  onSample,
}: {
  onAdd: () => void;
  onSample: () => void;
}) {
  const { messages } = useLocale();
  return (
    <Card data-testid="onboarding">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <h2 className="text-lg font-semibold">{t(messages, "welcomeTitle")}</h2>
        <p className="max-w-sm text-sm text-slate-400">
          {t(messages, "welcomeText")}
        </p>
        <div className="flex gap-2">
          <Button data-testid="add-first-child" onClick={onAdd}>
            {t(messages, "addChild")}
          </Button>
          <Button variant="muted" data-testid="sample-data" onClick={onSample}>
            {t(messages, "sampleData")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
