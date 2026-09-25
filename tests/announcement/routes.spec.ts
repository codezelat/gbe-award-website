import { expect, test } from "playwright/test";

const applicationUrl = "https://access.gbeaward.com/apply";

test("registration notice appears above the public header on active days", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-25T12:00:00+05:30") });

  for (const path of ["/", "/about", "/women-in-excellence"]) {
    await page.goto(path);
    const notice = page.locator("#registration-notice");

    await expect(notice).toBeVisible();
    await expect(notice).toContainText("Registration closes 27 Sep at 11:59 PM, Sri Lanka time");
    await expect(notice.getByRole("link", { name: "Register now" })).toHaveAttribute("href", applicationUrl);

    const positions = await page.evaluate(() => ({
      noticeBottom: document.getElementById("registration-notice")!.getBoundingClientRect().bottom,
      headerTop: document.getElementById("site-header")!.getBoundingClientRect().top,
    }));
    expect(positions.headerTop).toBeGreaterThanOrEqual(positions.noticeBottom - 1);
  }
});

test("final-day wording and midnight expiry follow Sri Lanka time", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-27T00:00:00+05:30") });
  await page.goto("/");

  const notice = page.locator("#registration-notice");
  await expect(notice).toContainText("Final 24 hours to register");

  await page.clock.fastForward(24 * 60 * 60 * 1000);
  await expect(notice).toBeHidden();
  await expect(page.locator("#site-header")).toHaveCSS("top", "0px");
});

test("mobile announcement remains readable without covering the menu", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-26T12:00:00+05:30") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator("#registration-notice")).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();

  const positions = await page.evaluate(() => ({
    noticeBottom: document.getElementById("registration-notice")!.getBoundingClientRect().bottom,
    menuTop: document.getElementById("mobile-menu")!.getBoundingClientRect().top,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(positions.menuTop).toBeGreaterThan(positions.noticeBottom);
  expect(positions.scrollWidth).toBeLessThanOrEqual(positions.viewportWidth + 1);
});
