import { absoluteUrl, assetUrl, buildBreadcrumbSchema, buildPageSchema, type JsonLd } from "../seo";
import { SITE_NAME, SITE_URL } from "../site";
import type { WinnerCardData } from "./queries";

function isoDate(value: Date | string | null | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function recipientSchemaType(type: WinnerCardData["recipientType"]) {
  if (type === "person") return "Person";
  if (type === "creative_work") return "CreativeWork";
  return "Organization";
}

export function buildWinnerArticleSchema({
  winner,
  path,
  title,
  description,
  image,
}: {
  winner: WinnerCardData;
  path: string;
  title: string;
  description: string;
  image: string;
}): JsonLd[] {
  const canonicalUrl = absoluteUrl(path);
  const recipientId = `${canonicalUrl}#recipient`;
  const articleType = winner.articleType === "news" ? "NewsArticle" : "Article";
  const publishedAt = isoDate(winner.publishedAt);
  const updatedAt = isoDate(winner.contentUpdatedAt || winner.publishedAt);
  const recipientName = winner.recipientName || "Award winner";
  const awardTitle = winner.awardTitle || "Global Business Excellence Awards winner";

  return [
    buildPageSchema({
      path,
      title,
      description,
      pageType: "WebPage",
      image,
    }),
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Previous Winners", path: "/previous-winners" },
      { name: recipientName, path },
    ]),
    {
      "@context": "https://schema.org",
      "@type": recipientSchemaType(winner.recipientType),
      "@id": recipientId,
      name: recipientName,
      url: winner.officialWebsiteUrl || canonicalUrl,
      image: assetUrl(image),
      award: awardTitle,
      sameAs: [winner.linkedinUrl, winner.facebookUrl, winner.instagramUrl].filter(Boolean),
    },
    {
      "@context": "https://schema.org",
      "@type": articleType,
      "@id": `${canonicalUrl}#article`,
      headline: title,
      description,
      image: [assetUrl(image)],
      datePublished: publishedAt,
      dateModified: updatedAt,
      author: {
        "@type": "Organization",
        name: winner.authorName || SITE_NAME,
        url: SITE_URL,
      },
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      mainEntityOfPage: {
        "@id": `${canonicalUrl}#webpage`,
      },
      about: {
        "@id": recipientId,
      },
      inLanguage: "en-GB",
      articleSection: winner.category,
    },
  ];
}
