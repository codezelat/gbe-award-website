import { describe, expect, it } from "vitest";

import {
  buildWinnerSlug,
  evaluateWinnerQuality,
  sanitizeWinnerHtml,
} from "../../src/lib/winners/content";

describe("winner story content contract", () => {
  it("builds a descriptive winner story slug", () => {
    expect(
      buildWinnerSlug(
        "Hiru TV",
        "Most Popular Television Channel of the Year",
        2025,
      ),
    ).toBe(
      "hiru-tv-wins-most-popular-television-channel-of-the-year-2025",
    );
  });

  it("removes scripts from winner story HTML", () => {
    expect(
      sanitizeWinnerHtml("<p>Safe</p><script>alert(1)</script>"),
    ).toBe("<p>Safe</p>");
  });

  it("marks an incomplete winner story as non-indexable", () => {
    const incompleteWinner = {};

    expect(evaluateWinnerQuality(incompleteWinner).indexable).toBe(false);
  });
});
