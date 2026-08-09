import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { t, useLocale } from "../lib/i18n";
import { ensureSession } from "../lib/session";
import { Button } from "./ui";

/** One-tap anonymous continue (ADR-001, ADR-006). */
export function ContinuePage() {
  const { messages } = useLocale();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: ensureSession,
    onSuccess: () => void navigate({ to: "/app" }),
  });

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-bold">{t(messages, "appTitle")}</h2>
      <p className="text-slate-400">{t(messages, "tagline")}</p>
      <Button
        data-testid="continue-button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {t(messages, "continue")}
      </Button>
      {mutation.isError && (
        <p className="text-sm text-rose-400" role="alert">
          {t(messages, "continueError")}
        </p>
      )}
    </div>
  );
}
