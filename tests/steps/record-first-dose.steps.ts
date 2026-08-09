import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

const { Given, When, Then } = createBdd();

/** Local-timezone ISO date (avoids UTC day-shift flakiness). */
const isoLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

Given("I open BayiQ", async ({ page }) => {
  await page.goto("/");
});

When("I continue anonymously", async ({ page }) => {
  await page.getByTestId("continue-button").click();
});

Then("I see the onboarding screen", async ({ page }) => {
  await expect(page.getByTestId("onboarding")).toBeVisible({
    timeout: 15_000,
  });
});

When(
  "I add a child named {string} born {int} months ago",
  async ({ page }, name: string, months: number) => {
    await page.getByTestId("add-first-child").click();
    await page.getByTestId("child-name").fill(name);
    const dob = new Date();
    dob.setDate(1);
    dob.setMonth(dob.getMonth() - months);
    await page.getByTestId("child-dob").fill(isoLocal(dob));
    await page.getByTestId("child-save").click();
  },
);

Then("I see the schedule for {string}", async ({ page }, name: string) => {
  await expect(page.getByTestId("schedule-table")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
});

When("I navigate the schedule to the birth column", async ({ page }) => {
  const prev = page.getByTestId("cols-prev");
  while (await prev.isEnabled()) {
    await prev.click();
  }
});

When("I click the Hepatitis B birth cell", async ({ page }) => {
  await page.getByTestId("cell-hepb-birth").click();
});

When("I save the record with date today", async ({ page }) => {
  await page.getByTestId("record-date").fill(isoLocal(new Date()));
  await page.getByTestId("record-save").click();
});

Then("the Hepatitis B birth cell shows {string}", async ({ page }, status: string) => {
  await expect(page.getByTestId("cell-hepb-birth")).toHaveClass(
    new RegExp(`status-${status}`),
  );
});

Then("the notification badge shows {int}", async ({ page }, count: number) => {
  await expect(page.getByTestId("notif-badge")).toHaveText(String(count));
});

Then("the sync status shows {string}", async ({ page }, text: string) => {
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByTestId("sync-status")).toHaveText(text, {
    timeout: 15_000,
  });
});

Then("the page has no serious accessibility violations", async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  if (serious.length > 0) {
    const detail = serious
      .map(
        (v) =>
          `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
      )
      .join("\n");
    throw new Error(`axe violations:\n${detail}`);
  }
});
