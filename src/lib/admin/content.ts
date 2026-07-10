import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { evaluateWinnerQuality, findWinnerParagraphReuse, isValidWinnerRichText } from "../winners/content";
import type { WinnerRichText, WinnerStoryRecord } from "../winners/types";

const emptyToNull = z.preprocess((value) => (value === "" ? null : value), z.string().nullable().optional());
const emptyToNullDate = z.preprocess((value) => (value === "" ? null : value), z.coerce.date().nullable().optional());
const nonEmptyStringList = z.array(z.string().trim().min(2).max(2_000)).max(30).optional();
const slugSource = /[^a-z0-9]+/g;

function optionalText(max: number) {
  return z.preprocess((value) => (value === "" ? null : value), z.string().trim().max(max).nullable().optional());
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const optionalHttpUrl = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().url().max(2_000).refine(isHttpUrl, "URL must use http or https.").nullable().optional(),
);
const optionalMediaUrl = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().max(2_000).refine((value) => value.startsWith("/") || isHttpUrl(value), "Media URL must be a site path or an http(s) URL.").nullable().optional(),
);

const richTextInput = z.custom<WinnerRichText>(isValidWinnerRichText, "Article body must be a valid rich-text document.");

export class WinnerContentError extends Error {}

export const winnerInputSchema = z.object({
  awardTitle: z.string().trim().min(3).max(180),
  recipientName: z.string().trim().min(2).max(160),
  organization: emptyToNull,
  category: z.string().trim().min(2).max(160),
  year: z.coerce.number().int().min(2000).max(2100).default(2026),
  summary: z.string().trim().max(1000).default(""),
  imageUrl: optionalMediaUrl,
  heroImageUrl: optionalMediaUrl,
  heroImageAlt: optionalText(300),
  heroImageCaption: optionalText(700),
  heroImageCredit: optionalText(240),
  socialImageUrl: optionalMediaUrl,
  recipientType: z.enum(["person", "organization", "creative_work"]).nullable().optional(),
  articleType: z.enum(["article", "news"]).optional(),
  headline: optionalText(240),
  standfirst: optionalText(1_200),
  body: richTextInput.nullable().optional(),
  industry: optionalText(180),
  officialWebsiteUrl: optionalHttpUrl,
  linkedinUrl: optionalHttpUrl,
  facebookUrl: optionalHttpUrl,
  instagramUrl: optionalHttpUrl,
  ceremonyDate: emptyToNullDate,
  awardCitation: optionalText(2_000),
  achievementHighlights: nonEmptyStringList,
  quoteText: optionalText(2_000),
  quoteAuthor: optionalText(180),
  quoteAuthorRole: optionalText(180),
  authorName: optionalText(180),
  publishedAt: emptyToNullDate,
  factCheckedAt: emptyToNullDate,
  indexingStatus: z.enum(["noindex", "index"]).optional(),
  sourceNotes: nonEmptyStringList,
  slug: z.string().trim().max(180).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  seoTitle: emptyToNull,
  seoDescription: emptyToNull,
}).superRefine((value, ctx) => {
  if (value.quoteText && !value.quoteAuthor) {
    ctx.addIssue({ code: "custom", path: ["quoteAuthor"], message: "A public quote needs a verified author." });
  }

  if ((value.quoteAuthor || value.quoteAuthorRole) && !value.quoteText) {
    ctx.addIssue({ code: "custom", path: ["quoteText"], message: "Quote author details require a public quote." });
  }
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

function winnerSlug(input: WinnerInput) {
  return input.slug ? slugify(input.slug) : slugify(`${input.recipientName}-${input.awardTitle}-${input.year}`);
}

function withWinnerDefaults(input: WinnerInput): WinnerInput {
  return {
    ...input,
    articleType: input.articleType ?? "article",
    indexingStatus: input.indexingStatus ?? "noindex",
    achievementHighlights: input.achievementHighlights ?? [],
    sourceNotes: input.sourceNotes ?? [],
  };
}

function mergeWinnerInput(existing: typeof schema.pastWinners.$inferSelect, input: WinnerInput): WinnerInput {
  const provided = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
  return withWinnerDefaults({ ...existing, ...provided } as WinnerInput);
}

function jsonEquals(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function qualityError(input: WinnerInput, publishedAt: Date | null) {
  const report = evaluateWinnerQuality({ ...input, publishedAt });
  if (!report.indexable) {
    throw new WinnerContentError(report.issues.map((issue) => issue.message).join(" "));
  }
}

async function ensureSlugAvailable(slug: string, winnerId?: string) {
  const [canonical, alias] = await Promise.all([
    db.select({ id: schema.pastWinners.id }).from(schema.pastWinners).where(eq(schema.pastWinners.slug, slug)).limit(1),
    db.select({ winnerId: schema.winnerSlugAliases.winnerId }).from(schema.winnerSlugAliases).where(eq(schema.winnerSlugAliases.alias, slug)).limit(1),
  ]);

  if (canonical[0] && canonical[0].id !== winnerId) {
    throw new WinnerContentError("That canonical URL is already used by another winner.");
  }

  if (alias[0] && alias[0].winnerId !== winnerId) {
    throw new WinnerContentError("That URL is retained as a legacy link for another winner.");
  }
}

async function enforceIndexingQuality(input: WinnerInput, candidateId: string | undefined, bodyChanged: boolean, publishedAt: Date | null) {
  if (input.indexingStatus !== "index") return;
  if (input.status !== "published") {
    throw new WinnerContentError("Only a published winner story can be indexable.");
  }

  qualityError(input, publishedAt);

  // Existing editorial records are not blocked on unrelated edits. New or changed copy
  // must not repeat substantial paragraphs from another indexed winner story.
  if (!bodyChanged) return;

  const publishedStories = await db
    .select({
      id: schema.pastWinners.id,
      body: schema.pastWinners.body,
    })
    .from(schema.pastWinners)
    .where(and(eq(schema.pastWinners.status, "published"), eq(schema.pastWinners.indexingStatus, "index")));
  const reuse = findWinnerParagraphReuse(
    { ...input, id: candidateId, publishedAt },
    publishedStories as WinnerStoryRecord[],
  );

  if (reuse.length > 0) {
    throw new WinnerContentError(
      `Article body repeats ${reuse.length} substantial paragraph${reuse.length === 1 ? "" : "s"} from another indexed winner story. Rewrite the repeated copy with source-backed detail before indexing.`,
    );
  }
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
  const completeInput = withWinnerDefaults(input);
  const now = new Date();
  const slug = winnerSlug(completeInput);
  const publishedAt = completeInput.publishedAt ?? (completeInput.status === "published" ? now : null);
  await ensureSlugAvailable(slug);
  await enforceIndexingQuality(completeInput, undefined, true, publishedAt);

  const values = {
    ...completeInput,
    market: null,
    slug,
    publishedAt,
    contentUpdatedAt: now,
    updatedAt: now,
  };

  const [row] = await db.insert(schema.pastWinners).values(values).returning();
  return row;
}

export async function updateWinner(id: string, input: WinnerInput) {
  const [existing] = await db.select().from(schema.pastWinners).where(eq(schema.pastWinners.id, id)).limit(1);
  if (!existing) return undefined;

  const completeInput = mergeWinnerInput(existing, input);
  const now = new Date();
  const slug = winnerSlug(completeInput);
  const publishedAt = completeInput.publishedAt ?? existing.publishedAt ?? (completeInput.status === "published" ? now : null);
  const bodyChanged = !jsonEquals(existing.body, completeInput.body);

  await ensureSlugAvailable(slug, id);
  await ensureSlugAvailable(existing.slug, id);
  await enforceIndexingQuality(completeInput, id, bodyChanged, publishedAt);

  const values = {
    ...completeInput,
    market: null,
    slug,
    publishedAt,
    contentUpdatedAt: now,
    updatedAt: now,
  };

  return db.transaction(async (tx) => {
    // A current canonical URL must always take precedence over an old alias. If an
    // editor deliberately restores a former slug, remove that self-alias first.
    if (slug !== existing.slug) {
      await tx.delete(schema.winnerSlugAliases).where(and(eq(schema.winnerSlugAliases.winnerId, id), eq(schema.winnerSlugAliases.alias, slug)));
    }

    const [row] = await tx.update(schema.pastWinners).set(values).where(eq(schema.pastWinners.id, id)).returning();

    if (slug !== existing.slug) {
      await tx
        .insert(schema.winnerSlugAliases)
        .values({ winnerId: id, alias: existing.slug })
        .onConflictDoNothing();
    }

    return row;
  });
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
