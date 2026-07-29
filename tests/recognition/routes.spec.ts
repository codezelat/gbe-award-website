import { expect, test } from "playwright/test";

test("recognition page explains each role and certificate authenticity", async ({ page }) => {
  await page.goto("/recognition");

  await expect(page).toHaveTitle(/Recognition and Certificate Authenticity/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Recognition, research and certificate authenticity");
  await expect(page.getByRole("heading", { name: "Distance Education Council" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SITC Campus Business Faculty" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "London Business Consultancy" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A certificate connected to a real award record" })).toBeVisible();
  await expect(page.getByText("it is not a certificate issued by the UK Government")).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

test("home and about pages expose the recognition framework", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Recognition with substance" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore recognition/ })).toHaveAttribute("href", "/recognition");

  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "The roles behind the programme" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read the full recognition framework" }).first()).toHaveAttribute("href", "/recognition");
});

test("recognition remains readable without horizontal overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/recognition");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByAltText("Distance Education Council Sri Lanka")).toBeVisible();
  await expect(page.getByAltText("SITC Campus")).toBeVisible();
  await expect(page.getByRole("img", { name: "London Business Consultancy" }).first()).toBeVisible();
});

test("about gallery hydrates only when visible and keeps working controls", async ({ page }) => {
  await page.goto("/about");

  await expect(page.locator(".about-gallery-slider")).toHaveCount(0);
  const gallery = page.getByRole("region", { name: "GBE Awards ceremony gallery" });
  await gallery.scrollIntoViewIfNeeded();
  await expect(page.locator(".about-gallery-slider")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next gallery image" })).toBeEnabled();
  await page.getByRole("button", { name: "Next gallery image" }).click();
});
