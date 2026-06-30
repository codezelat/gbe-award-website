import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";

const emptyToNull = z.preprocess((value) => (value === "" ? null : value), z.string().nullable().optional());
const slugSource = /[^a-z0-9]+/g;

export const winnerInputSchema = z.object({
  awardTitle: z.string().trim().min(3).max(180),
  recipientName: z.string().trim().min(2).max(160),
  organization: emptyToNull,
  category: z.string().trim().min(2).max(160),
  year: z.coerce.number().int().min(2000).max(2100).default(2026),
  summary: z.string().trim().max(1000).default(""),
  imageUrl: emptyToNull,
  slug: z.string().trim().max(180).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  seoTitle: emptyToNull,
  seoDescription: emptyToNull,
});

export const nominationInputSchema = z.object({
  awardTitle: z.string().trim().min(3).max(180),
  nomineeName: z.string().trim().min(2).max(160),
  organization: emptyToNull,
  category: z.string().trim().min(2).max(160),
  year: z.coerce.number().int().min(2000).max(2100).default(2026),
  market: z.string().trim().min(2).max(120).default("International"),
  summary: z.string().trim().max(1000).default(""),
  notes: z.string().trim().max(1200).default(""),
  imageUrl: emptyToNull,
  slug: z.string().trim().max(180).optional(),
  status: z.enum(["draft", "submitted", "shortlisted", "published", "archived"]).default("draft"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  seoTitle: emptyToNull,
  seoDescription: emptyToNull,
});

export type WinnerInput = z.infer<typeof winnerInputSchema>;
export type NominationInput = z.infer<typeof nominationInputSchema>;
export type ContentKind = "winners" | "nominations";

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(slugSource, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);

  return slug || crypto.randomUUID();
}

function clampPage(value: string | null) {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function clampLimit(value: string | null) {
  const limit = Number(value ?? "10");
  if (!Number.isFinite(limit)) return 10;
  return Math.min(Math.max(Math.floor(limit), 5), 50);
}

export async function listWinners(url: URL) {
  const page = clampPage(url.searchParams.get("page"));
  const limit = clampLimit(url.searchParams.get("limit"));
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const offset = (page - 1) * limit;
  const where = and(
    status && status !== "all" ? eq(schema.pastWinners.status, status as "draft" | "published" | "archived") : undefined,
    q
      ? or(
          ilike(schema.pastWinners.awardTitle, `%${q}%`),
          ilike(schema.pastWinners.recipientName, `%${q}%`),
          ilike(schema.pastWinners.organization, `%${q}%`),
          ilike(schema.pastWinners.category, `%${q}%`),
        )
      : undefined,
  );

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(schema.pastWinners)
      .where(where)
      .orderBy(desc(schema.pastWinners.year), asc(schema.pastWinners.sortOrder), desc(schema.pastWinners.updatedAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(schema.pastWinners).where(where),
  ]);

  const total = totalRows[0]?.value ?? 0;
  return { rows, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function listNominations(url: URL) {
  const page = clampPage(url.searchParams.get("page"));
  const limit = clampLimit(url.searchParams.get("limit"));
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const offset = (page - 1) * limit;
  const where = and(
    status && status !== "all"
      ? eq(schema.nominations.status, status as "draft" | "submitted" | "shortlisted" | "published" | "archived")
      : undefined,
    q
      ? or(
          ilike(schema.nominations.awardTitle, `%${q}%`),
          ilike(schema.nominations.nomineeName, `%${q}%`),
          ilike(schema.nominations.organization, `%${q}%`),
          ilike(schema.nominations.category, `%${q}%`),
          ilike(schema.nominations.market, `%${q}%`),
        )
      : undefined,
  );

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(schema.nominations)
      .where(where)
      .orderBy(desc(schema.nominations.year), asc(schema.nominations.sortOrder), desc(schema.nominations.updatedAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(schema.nominations).where(where),
  ]);

  const total = totalRows[0]?.value ?? 0;
  return { rows, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getDashboardStats() {
  const [winnerRows, nominationRows] = await Promise.all([
    db
      .select({
        total: count(),
        published: count(sql`case when ${schema.pastWinners.status} = 'published' then 1 end`),
        draft: count(sql`case when ${schema.pastWinners.status} = 'draft' then 1 end`),
      })
      .from(schema.pastWinners),
    db
      .select({
        total: count(),
        shortlisted: count(sql`case when ${schema.nominations.status} = 'shortlisted' then 1 end`),
        submitted: count(sql`case when ${schema.nominations.status} = 'submitted' then 1 end`),
      })
      .from(schema.nominations),
  ]);

  return {
    winners: winnerRows[0] ?? { total: 0, published: 0, draft: 0 },
    nominations: nominationRows[0] ?? { total: 0, shortlisted: 0, submitted: 0 },
  };
}

export async function createWinner(input: WinnerInput) {
  const values = {
    ...input,
    market: null,
    slug: input.slug ? slugify(input.slug) : slugify(`${input.recipientName}-${input.awardTitle}-${input.year}`),
    updatedAt: new Date(),
  };

  const [row] = await db.insert(schema.pastWinners).values(values).returning();
  return row;
}

export async function updateWinner(id: string, input: WinnerInput) {
  const values = {
    ...input,
    market: null,
    slug: input.slug ? slugify(input.slug) : slugify(`${input.recipientName}-${input.awardTitle}-${input.year}`),
    updatedAt: new Date(),
  };

  const [row] = await db.update(schema.pastWinners).set(values).where(eq(schema.pastWinners.id, id)).returning();
  return row;
}

export async function deleteWinner(id: string) {
  await db.delete(schema.pastWinners).where(eq(schema.pastWinners.id, id));
}

export async function createNomination(input: NominationInput) {
  const values = {
    ...input,
    slug: input.slug ? slugify(input.slug) : slugify(`${input.nomineeName}-${input.awardTitle}-${input.year}`),
    updatedAt: new Date(),
  };

  const [row] = await db.insert(schema.nominations).values(values).returning();
  return row;
}

export async function updateNomination(id: string, input: NominationInput) {
  const values = {
    ...input,
    slug: input.slug ? slugify(input.slug) : slugify(`${input.nomineeName}-${input.awardTitle}-${input.year}`),
    updatedAt: new Date(),
  };

  const [row] = await db.update(schema.nominations).set(values).where(eq(schema.nominations.id, id)).returning();
  return row;
}

export async function deleteNomination(id: string) {
  await db.delete(schema.nominations).where(eq(schema.nominations.id, id));
}
