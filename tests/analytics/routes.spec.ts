import { expect, test } from "playwright/test";

const measurementId = "G-F5X36V8EEJ";
const googleTagUrl = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;

test("public pages emit the requested Google Analytics tag exactly once", async ({ request }) => {
  for (const path of [
    "/",
    "/about",
    "/recognition",
    "/contact",
    "/privacy-policy",
    "/nominees",
    "/previous-winners",
    "/previous-winners/kavinga-perera-wins-most-popular-actor-of-the-year-2025",
  ]) {
    const response = await request.get(path);
    expect(response.ok(), `${path} should return a successful response`).toBe(true);

    const html = await response.text();
    expect(html.match(new RegExp(googleTagUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).toHaveLength(1);
    expect(html).toContain(`data-google-tag-id="${measurementId}"`);
    expect(html).toContain(`window.gtag('config', googleTagId)`);
    expect(html).not.toContain("GT-W6V9ZG59");
    expect(html).not.toContain("setTimeout(loadGoogleTag");
  }
});

test("protected admin pages do not emit Google Analytics", async ({ request }) => {
  const response = await request.get("/gbe-admin-safe/");
  expect(response.ok()).toBe(true);

  const html = await response.text();
  expect(html).not.toContain(measurementId);
  expect(html).not.toContain("googletagmanager.com/gtag/js");
  expect(html).not.toContain("window.dataLayer");
});

test("the browser initializes the Google Analytics queue once", async ({ page }) => {
  let googleTagLoads = 0;
  await page.route(googleTagUrl, async (route) => {
    googleTagLoads += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "",
    });
  });

  await page.goto("/");

  await expect(page.locator(`script[src="${googleTagUrl}"]`)).toHaveAttribute("async", "");

  const analyticsState = await page.evaluate(() => {
    const analyticsWindow = window as typeof window & {
      dataLayer?: Array<ArrayLike<unknown>>;
      gtag?: (...args: unknown[]) => void;
    };
    const commands = (analyticsWindow.dataLayer ?? []).map((entry) => Array.from(entry));

    return {
      hasGtag: typeof analyticsWindow.gtag === "function",
      configCommands: commands.filter((entry) => entry[0] === "config"),
      jsCommands: commands.filter((entry) => entry[0] === "js").length,
    };
  });

  expect(googleTagLoads).toBe(1);
  expect(analyticsState.hasGtag).toBe(true);
  expect(analyticsState.jsCommands).toBe(1);
  expect(analyticsState.configCommands).toEqual([["config", measurementId]]);
});
