import { describe, expect, it } from "vitest";

import { winnerInputSchema } from "../../src/lib/admin/content";
import { pickDistinctWinnerBannerImage } from "../../src/lib/winners/images";
import { mapWinnerStory } from "../../src/lib/winners/queries";

const baseWinnerRow = {
  id: "winner-1",
  awardTitle: "Most Popular Actress of the Year",
  recipientName: "Piyumali Edirisinghe",
  organization: null,
  category: "Entertainment",
  year: 2025,
  market: null,
  summary: "Public winner summary.",
  imageUrl: "https://cdn.example.com/winners/profile.webp",
  slug: "piyumali-edirisinghe-wins-most-popular-actress-of-the-year-2025",
  status: "published",
  sortOrder: 1,
  seoTitle: null,
  seoDescription: null,
  recipientType: null,
  articleType: "profile",
  headline: null,
  standfirst: null,
  body: null,
  industry: null,
  officialWebsiteUrl: null,
  linkedinUrl: null,
  facebookUrl: null,
  instagramUrl: null,
  ceremonyDate: null,
  awardCitation: null,
  achievementHighlights: null,
  quoteText: null,
  quoteAuthor: null,
  quoteAuthorRole: null,
  heroImageUrl: "https://cdn.example.com/winners/banner.webp",
  heroImageAlt: "Piyumali Edirisinghe winner banner",
  heroImageCaption: "Winner story banner",
  heroImageCredit: "GBE Awards",
  socialImageUrl: null,
  authorName: null,
  publishedAt: null,
  contentUpdatedAt: null,
  factCheckedAt: null,
  indexingStatus: "noindex",
  sourceNotes: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
} as const;

describe("winner banner media", () => {
  it("accepts optional banner fields in admin winner payloads", () => {
    const parsed = winnerInputSchema.parse({
      awardTitle: "Most Popular Actress of the Year",
      recipientName: "Piyumali Edirisinghe",
      organization: "",
      category: "Entertainment",
      year: "2025",
      summary: "Public winner summary.",
      imageUrl: "https://cdn.example.com/winners/profile.webp",
      heroImageUrl: "https://cdn.example.com/winners/banner.webp",
      heroImageAlt: "Piyumali Edirisinghe winner banner",
      heroImageCaption: "",
      heroImageCredit: "GBE Awards",
      slug: "",
      status: "published",
      sortOrder: "1",
      seoTitle: "",
      seoDescription: "",
    });

    expect(parsed).toMatchObject({
      imageUrl: "https://cdn.example.com/winners/profile.webp",
      heroImageUrl: "https://cdn.example.com/winners/banner.webp",
      heroImageAlt: "Piyumali Edirisinghe winner banner",
      heroImageCaption: null,
      heroImageCredit: "GBE Awards",
    });
  });

  it("keeps card images on the winner profile image when a banner exists", () => {
    const story = mapWinnerStory(baseWinnerRow);

    expect(story.imageUrl).toBe("https://cdn.example.com/winners/profile.webp");
    expect(story.heroImageUrl).toBe("https://cdn.example.com/winners/banner.webp");
    expect(story.heroImageAlt).toBe("Piyumali Edirisinghe winner banner");
  });

  it("treats the profile image as no separate banner when both URLs match", () => {
    expect(
      pickDistinctWinnerBannerImage(
        "https://cdn.example.com/winners/profile.webp",
        "https://cdn.example.com/winners/profile.webp",
      ),
    ).toBeNull();

    expect(
      pickDistinctWinnerBannerImage(
        "https://cdn.example.com/winners/banner.webp",
        "https://cdn.example.com/winners/profile.webp",
      ),
    ).toBe("https://cdn.example.com/winners/banner.webp");
  });
});
