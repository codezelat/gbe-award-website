import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "./db";

export type PublicAwardCard = {
  title: string;
  name: string;
  image: string;
  summary?: string;
  category?: string;
  market?: string;
  year?: number;
};

export type HomepageNomineeGroups = {
  featured: PublicAwardCard[];
  entries: PublicAwardCard[];
};

function mapNomination(row: typeof schema.nominations.$inferSelect): PublicAwardCard {
  return {
    title: row.awardTitle,
    name: row.nomineeName,
    image: row.imageUrl || "/assets/brand/award-icon.webp",
    summary: row.summary,
    category: row.category,
    market: row.market,
    year: row.year,
  };
}

function mapWinner(row: typeof schema.pastWinners.$inferSelect): PublicAwardCard {
  return {
    title: row.awardTitle,
    name: row.recipientName,
    image: row.imageUrl || "/assets/brand/award-icon.webp",
    summary: row.summary,
    category: row.category,
    market: row.market,
    year: row.year,
  };
}

function logPublicContentError(scope: string, error: unknown) {
  console.error(`[public-content] ${scope} failed`, error);
}

export async function getPublicNominees(): Promise<PublicAwardCard[]> {
  try {
    const rows = await db
      .select()
      .from(schema.nominations)
      .where(inArray(schema.nominations.status, ["shortlisted", "published"]))
      .orderBy(desc(schema.nominations.year), asc(schema.nominations.sortOrder), desc(schema.nominations.updatedAt))
      .limit(60);

    return rows.map(mapNomination);
  } catch (error) {
    logPublicContentError("getPublicNominees", error);
    return [];
  }
}

export async function getPublicWinners(limit = 120): Promise<PublicAwardCard[]> {
  try {
    const rows = await db
      .select()
      .from(schema.pastWinners)
      .where(eq(schema.pastWinners.status, "published"))
      .orderBy(desc(schema.pastWinners.year), asc(schema.pastWinners.sortOrder), desc(schema.pastWinners.updatedAt))
      .limit(limit);

    return rows.map(mapWinner);
  } catch (error) {
    logPublicContentError("getPublicWinners", error);
    return [];
  }
}

export async function getHomepageNominees(limit = 12): Promise<HomepageNomineeGroups> {
  const nominees = await getPublicNominees();
  const homepageNominees = nominees.slice(0, Math.max(0, limit));
  const featuredCount = Math.min(6, homepageNominees.length);

  return {
    featured: homepageNominees.slice(0, featuredCount),
    entries: homepageNominees.slice(featuredCount),
  };
}
