import { asc, desc, eq, inArray } from "drizzle-orm";
import { featuredNominees, nomineeEntries } from "../data/home";
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

const fallbackNominees = [...featuredNominees, ...nomineeEntries];
const fallbackWinners = featuredNominees.slice(0, 8);

export async function getPublicNominees(): Promise<PublicAwardCard[]> {
  try {
    const rows = await db
      .select()
      .from(schema.nominations)
      .where(inArray(schema.nominations.status, ["shortlisted", "published"]))
      .orderBy(desc(schema.nominations.year), asc(schema.nominations.sortOrder), desc(schema.nominations.updatedAt))
      .limit(60);

    if (!rows.length) return fallbackNominees;

    return rows.map((row) => ({
      title: row.awardTitle,
      name: row.nomineeName,
      image: row.imageUrl || "/assets/brand/award-icon.webp",
      summary: row.summary,
      category: row.category,
      market: row.market,
      year: row.year,
    }));
  } catch {
    return fallbackNominees;
  }
}

export async function getPublicWinners(): Promise<PublicAwardCard[]> {
  try {
    const rows = await db
      .select()
      .from(schema.pastWinners)
      .where(eq(schema.pastWinners.status, "published"))
      .orderBy(desc(schema.pastWinners.year), asc(schema.pastWinners.sortOrder), desc(schema.pastWinners.updatedAt))
      .limit(48);

    if (!rows.length) return fallbackWinners;

    return rows.map((row) => ({
      title: row.awardTitle,
      name: row.recipientName,
      image: row.imageUrl || "/assets/brand/award-icon.webp",
      summary: row.summary,
      category: row.category,
      market: row.market,
      year: row.year,
    }));
  } catch {
    return fallbackWinners;
  }
}
