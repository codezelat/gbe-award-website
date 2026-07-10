import { describe, expect, it } from "vitest";

import { buildWinnerEditorialUpdate, winnerEditorialWordCount } from "../../src/lib/winners/editorial";
import { getWinnerBodyParagraphs } from "../../src/lib/winners/content";

describe("winner editorial refresh", () => {
  it("builds a substantial, bounded award record without invented quotes or statistics", () => {
    const update = buildWinnerEditorialUpdate({
      recipientName: "Example Energy Ltd",
      awardTitle: "Best Solar Preventive Maintenance Provider",
      industry: "Solar maintenance",
      year: 2025,
      recipientType: "organization",
      officialWebsiteUrl: "https://example.com/about",
      sourceNotes: ["https://gbeaward.com/previous-winners/", "https://example.com/about"],
    });

    expect(update.headline).toContain("Example Energy Ltd wins Best Solar Preventive Maintenance Provider");
    expect(update.seoDescription).toContain("Example Energy Ltd");
    expect(update.authorName).toBe("GBE Awards Editorial Team");
    expect(update.quoteText).toBeUndefined();
    expect(winnerEditorialWordCount(update)).toBeGreaterThanOrEqual(350);
    expect(getWinnerBodyParagraphs(update.body)).toHaveLength(10);
  });

  it("does not treat the letters ev inside television as an electric-vehicle category", () => {
    const update = buildWinnerEditorialUpdate({
      recipientName: "Example Broadcaster",
      awardTitle: "Most Popular Television Channel of the Year",
      industry: "Television broadcasting",
      year: 2025,
      recipientType: "organization",
      sourceNotes: ["https://gbeaward.com/previous-winners/"],
    });

    expect(getWinnerBodyParagraphs(update.body).join(" ")).toContain("programmes, portfolios, campaigns, or public channels");
    expect(getWinnerBodyParagraphs(update.body).join(" ")).not.toContain("broad sustainability language");
  });
});
