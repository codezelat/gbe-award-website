import { expect, test } from "playwright/test";

test.describe("Women in Excellence page", () => {
  test("renders the programme, application guidance, gallery and FAQs", async ({ page }) => {
    const response = await page.goto("/women-in-excellence");

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Women in Excellence Awards 2026/);
    await expect(page.getByRole("heading", { level: 1, name: /Women in Excellence/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Apply now", exact: true }).first()).toHaveAttribute(
      "href",
      "https://access.gbeaward.com/apply",
    );
    await expect(page.getByRole("link", { name: "Apply now", exact: true }).last()).toHaveAttribute(
      "href",
      "https://wa.link/jd4dlh",
    );
    await expect(page.getByRole("link", { name: "Ask on WhatsApp" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Where excellence shows up" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Who should apply?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Build an application around evidence" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recognition in the room" })).toBeVisible();
    await expect(page.locator("[data-preview-image]")).toHaveCount(10);

    const faq = page.getByText("Is the programme only for business owners?", { exact: true });
    await faq.click();
    await expect(page.getByText("You do not need to be a founder or chief executive.", { exact: false })).toBeVisible();

    const schema = await page.locator('script[type="application/ld+json"]').textContent();
    expect(schema).toContain("FAQPage");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://gbeaward.com/women-in-excellence",
    );
  });

  test("has no horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/women-in-excellence");

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: /Women in Excellence/ })).toBeVisible();
  });
});
