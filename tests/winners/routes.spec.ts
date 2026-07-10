import { expect, test } from "playwright/test";

const canonicalPath = "/previous-winners/kavinga-perera-wins-most-popular-actor-of-the-year-2025";

test("canonical winner story renders without redundant header labels", async ({ page }) => {
  await page.goto(canonicalPath);

  await expect(page).toHaveTitle(/Kavinga Perera wins Most Popular Actor of the Year/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kavinga Perera wins Most Popular Actor of the Year");
  await expect(page.getByRole("heading", { name: "Winner Story", exact: true })).toHaveCount(0);
  await expect(page.getByText(/Kavinga Perera\s+•\s+2025/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "All previous winners" })).toHaveAttribute("href", "/previous-winners");
});

test("legacy winner slug redirects to canonical story slug", async ({ page }) => {
  const response = await page.goto("/previous-winners/kavinga-perera");

  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe(canonicalPath);
});

test("legacy root winner URL redirects to the canonical story", async ({ page }) => {
  const response = await page.goto("/chamara-samarawickrama-most-popular-teledrama-producer-of-the-year/");

  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe("/previous-winners/chamara-samarawickrama-wins-most-popular-teledrama-producer-of-the-year-2025");
});
