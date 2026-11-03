import { expect, test } from "@playwright/test";
import { guardBrowserErrors, signUpVerified } from "./helpers";
guardBrowserErrors();

test("new and rotated webhook secrets appear beside their webhook, then disappear on reload", async ({ page }) => {
  await signUpVerified(page, "Webhook Owner", "webhooksecret");
  await page.goto("/settings/webhooks");
  const endpoint = "https://example.com/mightybase-hook";
  await page.getByLabel("Endpoint URL").fill(endpoint);
  await page.getByRole("button", { name: "Create webhook", exact: true }).click();
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: endpoint, exact: true }) });
  const notice = card.getByRole("region", { name: "New signing secret" });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole("button", { name: "Copy secret" })).toBeVisible();
  const first = await notice.getByLabel("Signing secret", { exact: true }).textContent();
  expect(first?.trim()).toMatch(/^whsec_/);
  await expect(page.locator("#add-webhook").getByRole("region", { name: "New signing secret" })).toHaveCount(0);
  await expect(notice).toBeFocused();
  const rect = await notice.boundingBox();
  expect(rect).not.toBeNull();
  expect(rect!.y).toBeGreaterThanOrEqual(0);
  expect(rect!.y).toBeLessThan(page.viewportSize()!.height);
  await page.reload();
  await expect(page.getByRole("region", { name: "New signing secret" })).toHaveCount(0);
  await card.getByRole("button", { name: `Roll the signing secret of ${endpoint}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Roll secret", exact: true }).click();
  await expect(notice).toBeVisible();
  expect((await notice.getByLabel("Signing secret", { exact: true }).textContent())?.trim()).not.toBe(first?.trim());
});
