import { and, asc, count, desc, eq, ne, or, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { buildLegacyWinnerRootSlug, deriveDisplayAwardTitle, renderWinnerRichText } from "./content";
import { pickRealWinnerImage } from "./images";
import type { WinnerRichText, WinnerStoryRecord } from "./types";

export type WinnerCardData = WinnerStoryRecord & {
  displayAwardTitle: string;
  imageUrl?: string | null;
  storyPath: string;
  bodyHtml: string;
};

export type WinnerDirectoryResult = {
  winners: WinnerCardData[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

function toPositiveInteger(value: number | undefined, fallback: number) {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : fallback;
}

function storyPath(slug: string | null | undefined) {
  return `/previous-winners/${slug ?? ""}`;
}

export function mapWinnerStory(row: typeof schema.pastWinners.$inferSelect): WinnerCardData {
  const base = {
    id: row.id,
    awardTitle: row.awardTitle,
    recipientName: row.recipientName,
    organization: row.organization,
    category: row.category,
    year: row.year,
    slug: row.slug,
    status: row.status,
    recipientType: row.recipientType,
    articleType: row.articleType,
    headline: row.headline,
    standfirst: row.standfirst,
    body: row.body,
    industry: row.industry,
    officialWebsiteUrl: row.officialWebsiteUrl,
    linkedinUrl: row.linkedinUrl,
    facebookUrl: row.facebookUrl,
    instagramUrl: row.instagramUrl,
    awardCitation: row.awardCitation,
    achievementHighlights: row.achievementHighlights,
    heroImageUrl: row.heroImageUrl,
    heroImageAlt: row.heroImageAlt,
    heroImageCaption: row.heroImageCaption,
    heroImageCredit: row.heroImageCredit,
    socialImageUrl: row.socialImageUrl,
    authorName: row.authorName,
    publishedAt: row.publishedAt,
    contentUpdatedAt: row.contentUpdatedAt,
    factCheckedAt: row.factCheckedAt,
    indexingStatus: row.indexingStatus,
    sourceNotes: row.sourceNotes,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  };

  return {
    ...base,
    displayAwardTitle: deriveDisplayAwardTitle(base),
    imageUrl: row.imageUrl,
    storyPath: storyPath(row.slug),
    bodyHtml: row.body ? renderWinnerRichText(row.body as WinnerRichText) : "",
  };
}

export async function getWinnerDirectory(input: { page?: number; limit?: number; year?: number; category?: string } = {}): Promise<WinnerDirectoryResult> {
  const page = toPositiveInteger(input.page, 1);
  const limit = Math.min(toPositiveInteger(input.limit, 24), 48);
  const offset = (page - 1) * limit;
  const filters = [
    eq(schema.pastWinners.status, "published"),
    input.year ? eq(schema.pastWinners.year, input.year) : undefined,
    input.category ? eq(schema.pastWinners.category, input.category) : undefined,
  ].filter(Boolean);
  const where = and(...filters);

  try {
    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(schema.pastWinners)
        .where(where)
        .orderBy(desc(schema.pastWinners.year), asc(schema.pastWinners.sortOrder), desc(schema.pastWinners.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(schema.pastWinners).where(where),
    ]);

    const total = Number(totalRows[0]?.total ?? 0);

    return {
      winners: rows.map(mapWinnerStory),
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  } catch (error) {
    console.error("[winner-queries] getWinnerDirectory failed", error);
    return { winners: [], page, limit, total: 0, pages: 1 };
  }
}

export async function getPublishedWinnerBySlug(slug: string): Promise<WinnerCardData | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.pastWinners)
      .where(and(eq(schema.pastWinners.slug, slug), eq(schema.pastWinners.status, "published")))
      .limit(1);

    return row ? mapWinnerStory(row) : null;
  } catch (error) {
    console.error("[winner-queries] getPublishedWinnerBySlug failed", error);
    return null;
  }
}

export async function resolveWinnerSlug(slug: string): Promise<{ winner: WinnerCardData; redirect: boolean } | null> {
  const canonical = await getPublishedWinnerBySlug(slug);
  if (canonical) return { winner: canonical, redirect: false };

  try {
    const [aliasRow] = await db
      .select({ winner: schema.pastWinners })
      .from(schema.winnerSlugAliases)
      .innerJoin(schema.pastWinners, eq(schema.winnerSlugAliases.winnerId, schema.pastWinners.id))
      .where(and(eq(schema.winnerSlugAliases.alias, slug), eq(schema.pastWinners.status, "published")))
      .limit(1);

    return aliasRow?.winner ? { winner: mapWinnerStory(aliasRow.winner), redirect: true } : null;
  } catch (error) {
    console.error("[winner-queries] resolveWinnerSlug failed", error);
    return null;
  }
}

function legacyRootSlugFromSource(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname !== "gbeaward.com" && url.hostname !== "www.gbeaward.com") return null;
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.length === 1 ? segments[0] : null;
  } catch {
    return null;
  }
}

/**
 * Resolves the single-segment winner URLs published by the retired WordPress
 * site. Canonical and alias slugs are checked first, then the historical
 * recipient-plus-award slug pattern and exact legacy source URLs.
 */
export async function resolveLegacyWinnerRootSlug(slug: string): Promise<WinnerCardData | null> {
  const existing = await resolveWinnerSlug(slug);
  if (existing) return existing.winner;

  try {
    const rows = await db
      .select({
        slug: schema.pastWinners.slug,
        recipientName: schema.pastWinners.recipientName,
        awardTitle: schema.pastWinners.awardTitle,
        sourceNotes: schema.pastWinners.sourceNotes,
      })
      .from(schema.pastWinners)
      .where(eq(schema.pastWinners.status, "published"));
    const matched = rows.find((row) =>
      buildLegacyWinnerRootSlug(row.recipientName, row.awardTitle) === slug ||
      (row.sourceNotes ?? []).some((source) => legacyRootSlugFromSource(source) === slug),
    );

    return matched ? getPublishedWinnerBySlug(matched.slug) : null;
  } catch (error) {
    console.error("[winner-queries] resolveLegacyWinnerRootSlug failed", error);
    return null;
  }
}

export async function getRelatedWinners(winner: WinnerStoryRecord, limit = 3): Promise<WinnerCardData[]> {
  if (!winner.id) return [];

  try {
    const rows = await db
      .select({
        id: schema.pastWinners.id,
        awardTitle: schema.pastWinners.awardTitle,
        recipientName: schema.pastWinners.recipientName,
        category: schema.pastWinners.category,
        year: schema.pastWinners.year,
        slug: schema.pastWinners.slug,
        status: schema.pastWinners.status,
        headline: schema.pastWinners.headline,
      })
      .from(schema.pastWinners)
      .where(
        and(
          eq(schema.pastWinners.status, "published"),
          ne(schema.pastWinners.id, winner.id),
          or(eq(schema.pastWinners.category, winner.category ?? ""), eq(schema.pastWinners.year, winner.year ?? 0)),
        ),
      )
      .orderBy(desc(sql`case when ${schema.pastWinners.category} = ${winner.category ?? ""} then 1 else 0 end`), asc(schema.pastWinners.sortOrder), desc(schema.pastWinners.updatedAt))
      .limit(Math.max(0, limit));

    return rows.map((row) => ({
      ...row,
      displayAwardTitle: deriveDisplayAwardTitle(row),
      storyPath: storyPath(row.slug),
      bodyHtml: "",
    }));
  } catch (error) {
    console.error("[winner-queries] getRelatedWinners failed", error);
    return [];
  }
}

export async function getIndexableWinnerUrls(): Promise<Array<{ slug: string; lastmod: Date; imageUrl?: string | null; recipientName?: string | null }>> {
  try {
    const rows = await db
      .select({
        slug: schema.pastWinners.slug,
        recipientName: schema.pastWinners.recipientName,
        contentUpdatedAt: schema.pastWinners.contentUpdatedAt,
        publishedAt: schema.pastWinners.publishedAt,
        updatedAt: schema.pastWinners.updatedAt,
        heroImageUrl: schema.pastWinners.heroImageUrl,
        imageUrl: schema.pastWinners.imageUrl,
      })
      .from(schema.pastWinners)
      .where(and(eq(schema.pastWinners.status, "published"), eq(schema.pastWinners.indexingStatus, "index")))
      .orderBy(desc(schema.pastWinners.contentUpdatedAt), desc(schema.pastWinners.publishedAt));

    return rows.map((row) => ({
      slug: row.slug,
      recipientName: row.recipientName,
      lastmod: row.contentUpdatedAt || row.publishedAt || row.updatedAt,
      imageUrl: pickRealWinnerImage(row.heroImageUrl, row.imageUrl),
    }));
  } catch (error) {
    console.error("[winner-queries] getIndexableWinnerUrls failed", error);
    return [];
  }
}
