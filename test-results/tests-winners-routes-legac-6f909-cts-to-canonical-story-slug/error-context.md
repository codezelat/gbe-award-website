# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/winners/routes.spec.ts >> legacy winner slug redirects to canonical story slug
- Location: tests/winners/routes.spec.ts:15:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  1  | import { expect, test } from "playwright/test";
  2  | 
  3  | const canonicalPath = "/previous-winners/kavinga-perera-wins-most-popular-actor-of-the-year-2025";
  4  | 
  5  | test("canonical winner story renders without redundant header labels", async ({ page }) => {
  6  |   await page.goto(canonicalPath);
  7  | 
  8  |   await expect(page).toHaveTitle(/Kavinga Perera wins Most Popular Actor of the Year/);
  9  |   await expect(page.getByRole("heading", { level: 1 })).toContainText("Kavinga Perera wins Most Popular Actor of the Year");
  10 |   await expect(page.getByText("Winner Story")).toHaveCount(0);
  11 |   await expect(page.getByText(/Kavinga Perera\s+•\s+2025/)).toHaveCount(0);
  12 |   await expect(page.getByRole("link", { name: "All previous winners" })).toHaveAttribute("href", "/previous-winners");
  13 | });
  14 | 
  15 | test("legacy winner slug redirects to canonical story slug", async ({ page }) => {
  16 |   const response = await page.goto("/previous-winners/kavinga-perera");
  17 | 
> 18 |   expect(response?.status()).toBe(200);
     |                              ^ Error: expect(received).toBe(expected) // Object.is equality
  19 |   expect(new URL(page.url()).pathname).toBe(canonicalPath);
  20 | });
  21 | 
```