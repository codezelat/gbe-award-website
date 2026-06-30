import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../src/lib/db";
import { buildWinnerSlug, evaluateWinnerQuality, renderWinnerRichText, sanitizeWinnerHtml } from "../src/lib/winners/content";

const storyDir = join(process.cwd(), "content", "winner-stories", "2025");
const checkOnly = process.argv.includes("--check");

const richTextNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    type: z.string(),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(richTextNodeSchema).optional(),
    marks: z.array(z.object({ type: z.string(), attrs: z.record(z.string(), z.unknown()).optional() })).optional(),
    text: z.string().optional(),
  }),
);

const storyPackageSchema = z.object({
  winnerId: z.string().uuid(),
  legacySlug: z.string().min(1),
  canonicalSlug: z.string().min(10).max(180),
  recipientType: z.enum(["person", "organization", "creative_work"]),
  articleType: z.enum(["article", "news"]).default("article"),
  headline: z.string().min(35).max(180),
  standfirst: z.string().min(80).max(360),
  body: richTextNodeSchema,
  industry: z.string().min(2).max(120).optional().nullable(),
  officialWebsiteUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  facebookUrl: z.string().url().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  awardCitation: z.string().max(800).optional().nullable(),
  achievementHighlights: z.array(z.string().min(3).max(220)).max(6).optional().nullable(),
  heroImageUrl: z.string().url().optional().nullable(),
  heroImageAlt: z.string().min(20).max(180),
  heroImageCaption: z.string().max(260).optional().nullable(),
  heroImageCredit: z.string().max(120).optional().nullable(),
  socialImageUrl: z.string().url().optional().nullable(),
  authorName: z.string().min(2).max(120).default("London Business Consultancy"),
  publishedAt: z.string().datetime(),
  contentUpdatedAt: z.string().datetime(),
  factCheckedAt: z.string().datetime(),
  indexingStatus: z.enum(["noindex", "index"]).default("noindex"),
  sourceNotes: z.array(z.string().min(8).max(500)).min(1),
  seoTitle: z.string().min(35).max(80),
  seoDescription: z.string().min(80).max(170),
});

type StoryPackage = z.infer<typeof storyPackageSchema>;

function paragraphTexts(node: unknown): string[] {
  if (!node || typeof node !== "object") return [];
  const record = node as { type?: string; text?: string; content?: unknown[] };
  if (record.type === "paragraph") {
    const text = (record.content ?? [])
      .map((child) => (typeof child === "object" && child && "text" in child ? String((child as { text?: unknown }).text ?? "") : ""))
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    return text ? [text] : [];
  }
  return (record.content ?? []).flatMap(paragraphTexts);
}

function hasNameAndAwardInOpening(story: StoryPackage, recipientName: string, awardTitle: string) {
  const opening = paragraphTexts(story.body).slice(0, 2).join(" ").toLowerCase();
  const visibleAwardTitle = story.headline.replace(new RegExp(`^${recipientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} wins\\s+`, "i"), "");
  return (
    opening.includes(recipientName.toLowerCase()) &&
    (opening.includes(awardTitle.toLowerCase().slice(0, 28)) ||
      opening.includes(visibleAwardTitle.toLowerCase().slice(0, 28)))
  );
}

async function readPackages() {
  const files = (await readdir(storyDir)).filter((file) => file.endsWith(".json")).sort();

  return Promise.all(
    files.map(async (file) => {
      const raw = await readFile(join(storyDir, file), "utf8");
      return { file, story: storyPackageSchema.parse(JSON.parse(raw)) };
    }),
  );
}

async function validatePackages(packages: Array<{ file: string; story: StoryPackage }>) {
  const errors: string[] = [];
  const slugs = new Set<string>();
  const paragraphs = new Map<string, string>();

  for (const { file, story } of packages) {
    if (slugs.has(story.canonicalSlug)) errors.push(`${file}: duplicate canonicalSlug ${story.canonicalSlug}`);
    slugs.add(story.canonicalSlug);

    const [winner] = await db.select().from(schema.pastWinners).where(eq(schema.pastWinners.id, story.winnerId)).limit(1);
    if (!winner) {
      errors.push(`${file}: winnerId does not exist`);
      continue;
    }

    const expectedFallbackSlug = buildWinnerSlug(winner.recipientName, winner.awardTitle, winner.year);
    if (story.canonicalSlug !== expectedFallbackSlug && !story.canonicalSlug.includes(winner.recipientName.toLowerCase().split(/\s+/)[0])) {
      errors.push(`${file}: canonicalSlug does not clearly identify the recipient`);
    }

    const bodyHtml = renderWinnerRichText(story.body);
    if (bodyHtml !== sanitizeWinnerHtml(bodyHtml)) errors.push(`${file}: body HTML is outside the allowlist`);
    if (!hasNameAndAwardInOpening(story, winner.recipientName, winner.awardTitle)) {
      errors.push(`${file}: opening copy must mention recipient and award title`);
    }

    for (const paragraph of paragraphTexts(story.body)) {
      const key = paragraph.toLowerCase();
      if (key.length > 140 && paragraphs.has(key)) {
        errors.push(`${file}: duplicates paragraph from ${paragraphs.get(key)}`);
      }
      if (key.length > 140) paragraphs.set(key, file);
    }

    const quality = evaluateWinnerQuality({
      ...winner,
      ...story,
      body: story.body,
    });
    if (story.indexingStatus === "index" && !quality.indexable) {
      errors.push(`${file}: indexingStatus=index but quality failed: ${quality.issues.map((issue) => issue.field).join(", ")}`);
    }

    const [slugConflict] = await db
      .select({ id: schema.pastWinners.id })
      .from(schema.pastWinners)
      .where(and(eq(schema.pastWinners.slug, story.canonicalSlug), ne(schema.pastWinners.id, story.winnerId)))
      .limit(1);
    if (slugConflict) errors.push(`${file}: canonicalSlug conflicts with another winner`);
  }

  return errors;
}

async function importPackages(packages: Array<{ file: string; story: StoryPackage }>) {
  let updated = 0;
  let aliases = 0;

  for (const { story } of packages) {
    const [existing] = await db.select().from(schema.pastWinners).where(eq(schema.pastWinners.id, story.winnerId)).limit(1);
    if (!existing) continue;

    if (existing.slug !== story.canonicalSlug) {
      await db
        .insert(schema.winnerSlugAliases)
        .values({ winnerId: existing.id, alias: existing.slug })
        .onConflictDoNothing();
      aliases += 1;
    }

    await db
      .update(schema.pastWinners)
      .set({
        slug: story.canonicalSlug,
        recipientType: story.recipientType,
        articleType: story.articleType,
        headline: story.headline,
        standfirst: story.standfirst,
        body: story.body,
        industry: story.industry,
        officialWebsiteUrl: story.officialWebsiteUrl,
        linkedinUrl: story.linkedinUrl,
        facebookUrl: story.facebookUrl,
        instagramUrl: story.instagramUrl,
        awardCitation: story.awardCitation,
        achievementHighlights: story.achievementHighlights,
        heroImageUrl: story.heroImageUrl,
        heroImageAlt: story.heroImageAlt,
        heroImageCaption: story.heroImageCaption,
        heroImageCredit: story.heroImageCredit,
        socialImageUrl: story.socialImageUrl,
        authorName: story.authorName,
        publishedAt: new Date(story.publishedAt),
        contentUpdatedAt: new Date(story.contentUpdatedAt),
        factCheckedAt: new Date(story.factCheckedAt),
        indexingStatus: story.indexingStatus,
        sourceNotes: story.sourceNotes,
        seoTitle: story.seoTitle,
        seoDescription: story.seoDescription,
        market: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.pastWinners.id, story.winnerId));
    updated += 1;
  }

  return { updated, aliases };
}

async function main() {
  const packages = await readPackages();
  const errors = await validatePackages(packages);

  if (errors.length > 0) {
    console.error(JSON.stringify({ ok: false, checked: packages.length, errors }, null, 2));
    process.exit(1);
  }

  if (checkOnly) {
    console.log(JSON.stringify({ ok: true, checked: packages.length, mode: "check" }, null, 2));
    return;
  }

  const result = await importPackages(packages);
  console.log(JSON.stringify({ ok: true, checked: packages.length, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
