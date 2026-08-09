import { describe, expect, it, vi } from "vitest";
import { emitOpenDose, onOpenDose } from "./dose-events";

describe("dose events", () => {
  it("delivers an open-dose event to subscribers", () => {
    const fn = vi.fn();
    const unsub = onOpenDose(fn);
    emitOpenDose({ childId: "c1", doseId: "hepb-birth" });
    expect(fn).toHaveBeenCalledWith({
      childId: "c1",
      doseId: "hepb-birth",
    });
    unsub();
  });

  it("stops delivering after unsubscribe", () => {
    const fn = vi.fn();
    const unsub = onOpenDose(fn);
    unsub();
    emitOpenDose({ childId: "c1", doseId: "hepb-birth" });
    expect(fn).not.toHaveBeenCalled();
  });
});
