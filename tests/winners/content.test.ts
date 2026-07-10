import { describe, expect, it } from "vitest";

import {
  buildWinnerSlug,
  evaluateWinnerQuality,
  findWinnerParagraphReuse,
  isValidWinnerRichText,
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

  it("accepts only a bounded renderable rich-text document", () => {
    expect(isValidWinnerRichText({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Source-backed winner story." }] }] })).toBe(true);
    expect(isValidWinnerRichText({ type: "doc", content: [{ type: "script", text: "alert(1)" }] })).toBe(false);
  });

  it("finds substantial copy reused from another winner story", () => {
    const reusedParagraph = "This is a deliberately substantial paragraph that describes a winner in enough detail to make verbatim reuse across indexed article pages a real editorial quality issue.";
    const candidate = { id: "candidate", body: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: reusedParagraph }] }] } } as const;
    const existing = [{ id: "existing", body: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: reusedParagraph }] }] } }] as const;

    expect(findWinnerParagraphReuse(candidate, existing)).toEqual([
      { paragraph: reusedParagraph, matchingWinnerIds: ["existing"] },
    ]);
  });
});
