import { expect, test } from "playwright/test";

test("recognition page explains each role and certificate authenticity", async ({ page }) => {
  await page.goto("/recognition");

  await expect(page).toHaveTitle(/Recognition and Certificate Authenticity/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Recognition, research and certificate authenticity");
  await expect(page.getByRole("heading", { name: "DEC", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SITC Campus Business Faculty" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "London Business Consultancy" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A certificate connected to a real award record" })).toBeVisible();
  await expect(page.getByText("it is not a certificate issued by the UK Government")).toBeVisible();
  await expect(page.getByText(new RegExp("Ministry of Industry.*Gazette No\\. 2387/25"))).toBeVisible();
  await expect(page.getByText(/education provider, awarding body, or academic accreditor/)).toBeVisible();
  await expect(page.locator('section[aria-labelledby="roles-title"] a')).toHaveCount(0);
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

test("home and about pages expose the recognition framework", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Recognition with substance" })).toBeVisible();
  await expect(page.getByText("Recognition framework", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "A clear chain of authenticity" })).toHaveCount(0);
  await expect(page.getByText(/institutionally recognised in Sri Lanka through DEC/).first()).toBeVisible();
  await expect(page.getByText("Ministry of Industry", { exact: true })).toBeVisible();
  await expect(page.getByText("Gazette No. 2387/25")).toHaveCount(0);
  const countryMarks = page.getByRole("group", { name: "Sri Lanka recognition and United Kingdom programme administration" });
  await expect(countryMarks).toBeVisible();
  await expect(countryMarks.locator("img")).toHaveCount(2);
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
  await expect(page.getByAltText("DEC Sri Lanka")).toBeVisible();
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

test("recognition event gallery hydrates below the organisation roles", async ({ page }) => {
  await page.goto("/recognition");

  const gallery = page.getByRole("region", { name: "Recognition in action" });
  await gallery.scrollIntoViewIfNeeded();
  await expect(page.locator(".about-gallery-slider")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next gallery image" })).toBeEnabled();
});

test("contact content uses the same bounded page width as about", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/contact");

  const width = await page.locator("main > section").first().evaluate((element) => element.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(1120);
});

test("updated homepage and contact layouts do not overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of ["/", "/contact"]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
  }
});

test("Best Website Awards applications feature is correctly placed and linked", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const categories = page.getByRole("heading", { name: "Awards Across Diverse Categories" });
  const feature = page.getByRole("heading", { name: "Best Website Awards 2026" });
  await expect(feature).toBeVisible();
  await expect(page.getByText("Applications open")).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply", exact: true })).toHaveAttribute(
    "href",
    "https://bestwebsiteaward.com/",
  );
  await expect(page.getByRole("link", { name: "Explore Best Website Awards 2026" })).toHaveAttribute(
    "href",
    "https://bestwebsiteaward.com/",
  );

  const immediatelyAfterCategories = await page.evaluate(() => {
    const categoriesHeading = [...document.querySelectorAll("h2")].find((element) =>
      element.textContent?.includes("Awards Across Diverse Categories"),
    );
    const featureHeading = [...document.querySelectorAll("h2")].find((element) =>
      element.textContent?.includes("Best Website Awards 2026"),
    );
    return (
      categoriesHeading?.closest("section")?.nextElementSibling ===
      featureHeading?.closest("section")
    );
  });
  expect(immediatelyAfterCategories).toBe(true);
  await expect(categories).toBeVisible();

  const featureWidth = await page
    .getByRole("region", { name: "Best Website Awards 2026" })
    .locator(":scope > .container-gbe")
    .evaluate((element) => element.getBoundingClientRect().width);
  const magazineWidth = await page
    .getByRole("region", { name: "Read the GBE Awards 2025 Magazine" })
    .locator(":scope > .container-gbe")
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(featureWidth).toBe(magazineWidth);

  await page.goto("/contact");
  await expect(page.getByRole("heading", { name: "Best Website Awards 2026" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply", exact: true })).toHaveAttribute(
    "href",
    "https://bestwebsiteaward.com/",
  );
});
