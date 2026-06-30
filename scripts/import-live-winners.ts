import "dotenv/config";
import { extname } from "node:path";
import { eq, inArray, notInArray } from "drizzle-orm";
import { db, schema } from "../src/lib/db";
import { uploadBufferToR2 } from "../src/lib/admin/r2";
import { slugify } from "../src/lib/admin/content";

const WINNER_API_URL = "https://gbeaward.com/wp-json/wp/v2/winner?per_page=100&page=1&_embed";
const ALLOW_ARCHIVE_MISSING_WINNERS = process.env.ALLOW_ARCHIVE_MISSING_WINNERS === "true";
const CONCURRENCY = 6;
const contentTypeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

type WordPressWinner = {
  id: number;
  slug: string;
  link: string;
  date: string;
  title: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
    }>;
  };
};

type ImportedWinner = {
  id: number;
  slug: string;
  link: string;
  recipientName: string;
  awardTitle: string;
  imageUrl: string | null;
  organization: string | null;
  category: string;
  year: number;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
};

const uploadedImageCache = new Map<string, string>();

function decodeHtml(input: string) {
  return input
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(input: string) {
  return decodeHtml(input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

function normalizeWhitespace(input: string) {
  return input
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function extractWinnerHeading(html: string) {
  const match = html.match(/<h2 class="elementor-heading-title[^"]*">([\s\S]*?)<\/h2>/i);
  return match ? normalizeWhitespace(stripTags(match[1])) : "";
}

function inferOrganization(name: string) {
  const parts = name.split(/\s+[–-]\s+/).map((part) => part.trim()).filter(Boolean);
  const candidate = parts.length > 1 ? parts[parts.length - 1] : name;
  const companyHint =
    /\b(ltd|limited|pvt|private|plc|inc|llc|company|group|holdings|media|tv|radio|bank|hotel|academy|school|college|university|studio|network|channel|house|clinic|care|solutions|engineering|foods|fashion|jewellery|jewelry|motors|builders|travel|digital|events)\b/i;

  if (companyHint.test(candidate) || /^[A-Z0-9 '&().,-]{5,}$/.test(candidate)) {
    return candidate;
  }

  return null;
}

function parseAwardMeta(heading: string, fallbackYear: number) {
  const match = heading.match(/^(.*?)(?:\s+-\s+([A-Za-z]+\s+\d{4}))?$/);
  const awardTitle = normalizeWhitespace(match?.[1] || heading || "Global Business Excellence Award Winner");
  const period = match?.[2] || "";
  const yearMatch = period.match(/(\d{4})$/);

  return {
    awardTitle,
    year: yearMatch ? Number(yearMatch[1]) : fallbackYear,
    period,
  };
}

function buildSummary(recipientName: string, awardTitle: string, year: number, period: string) {
  const when = period || String(year);
  return `${recipientName} was recognised as ${awardTitle} at the Global Business Excellence Awards in ${when}.`;
}

function clampSeoDescription(input: string) {
  if (input.length <= 160) return input;
  return `${input.slice(0, 157).trimEnd()}...`;
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "gbe-award-website-importer/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "gbe-award-website-importer/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function uploadRemoteImage(url: string | null, folder: string, filenameBase: string) {
  if (!url) return null;

  const cached = uploadedImageCache.get(url);
  if (cached) return cached;

  const response = await fetch(url, {
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
      "User-Agent": "gbe-award-website-importer/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Image download failed for ${url}: ${response.status} ${response.statusText}`);
  }

  const rawContentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() || "";
  const extension = extname(new URL(url).pathname).toLowerCase();
  const contentType = contentTypeByExtension[extension] || rawContentType;

  if (!contentType) {
    throw new Error(`Unsupported image type for ${url}`);
  }

  const upload = await uploadBufferToR2({
    body: new Uint8Array(await response.arrayBuffer()),
    contentType,
    folder,
    filename: `${filenameBase}${extension || ""}`,
  });

  if (!upload.ok) {
    throw new Error(upload.error);
  }

  uploadedImageCache.set(url, upload.url);
  return upload.url;
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  limit: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
) {
  const results: TOutput[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function fetchImportedWinners() {
  const winners = await fetchJson<WordPressWinner[]>(WINNER_API_URL);

  return mapWithConcurrency(winners, CONCURRENCY, async (winner, index): Promise<ImportedWinner> => {
    const fallbackYear = new Date(winner.date).getUTCFullYear() || 2025;
    const recipientName = normalizeWhitespace(stripTags(winner.title.rendered));
    const detailHtml = await fetchText(winner.link);
    const detailHeading = extractWinnerHeading(detailHtml);
    const awardMeta = parseAwardMeta(detailHeading, fallbackYear);
    const summary = buildSummary(recipientName, awardMeta.awardTitle, awardMeta.year, awardMeta.period);
    const seoDescription = clampSeoDescription(summary);
    const imageUrl = await uploadRemoteImage(
      winner._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null,
      "winners",
      winner.slug || recipientName,
    );

    return {
      id: winner.id,
      slug: slugify(winner.slug || `${recipientName}-${awardMeta.awardTitle}-${awardMeta.year}`),
      link: winner.link,
      recipientName,
      awardTitle: awardMeta.awardTitle,
      imageUrl,
      organization: inferOrganization(recipientName),
      category: awardMeta.awardTitle,
      year: awardMeta.year,
      summary,
      seoTitle: `${recipientName} | ${awardMeta.awardTitle} Winner | Global Business Excellence Awards`,
      seoDescription,
      sortOrder: index,
    };
  });
}

async function upsertWinner(winner: ImportedWinner) {
  const insertValues = {
    awardTitle: winner.awardTitle,
    recipientName: winner.recipientName,
    organization: winner.organization,
    category: winner.category,
    year: winner.year,
    market: null,
    summary: winner.summary,
    imageUrl: winner.imageUrl,
    slug: winner.slug,
    status: "published" as const,
    sortOrder: winner.sortOrder,
    seoTitle: winner.seoTitle,
    seoDescription: winner.seoDescription,
    updatedAt: new Date(),
  };
  const updateValues = {
    awardTitle: winner.awardTitle,
    recipientName: winner.recipientName,
    organization: winner.organization,
    category: winner.category,
    year: winner.year,
    market: null,
    imageUrl: winner.imageUrl,
    status: "published" as const,
    sortOrder: winner.sortOrder,
    updatedAt: new Date(),
  };

  const existing = await db
    .select({ id: schema.pastWinners.id })
    .from(schema.pastWinners)
    .where(eq(schema.pastWinners.slug, winner.slug))
    .limit(1);
  const aliasMatch = existing[0]
    ? []
    : await db
        .select({ id: schema.pastWinners.id })
        .from(schema.winnerSlugAliases)
        .innerJoin(schema.pastWinners, eq(schema.winnerSlugAliases.winnerId, schema.pastWinners.id))
        .where(eq(schema.winnerSlugAliases.alias, winner.slug))
        .limit(1);
  const existingId = existing[0]?.id ?? aliasMatch[0]?.id;

  if (existingId) {
    await db.update(schema.pastWinners).set(updateValues).where(eq(schema.pastWinners.id, existingId));
    return "updated";
  }

  await db.insert(schema.pastWinners).values(insertValues);
  return "inserted";
}

async function archiveMissingWinners(activeSlugs: string[]) {
  if (!ALLOW_ARCHIVE_MISSING_WINNERS) return 0;
  if (activeSlugs.length === 0) return 0;

  const rows = await db
    .select({ id: schema.pastWinners.id })
    .from(schema.pastWinners)
    .where(notInArray(schema.pastWinners.slug, activeSlugs));

  if (rows.length === 0) return 0;

  await db
    .update(schema.pastWinners)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(notInArray(schema.pastWinners.slug, activeSlugs));

  return rows.length;
}

async function verifyImportedCount(activeSlugs: string[]) {
  const rows = await db
    .select({ slug: schema.pastWinners.slug })
    .from(schema.pastWinners)
    .where(inArray(schema.pastWinners.slug, activeSlugs));

  return rows.length;
}

async function main() {
  const winners = await fetchImportedWinners();
  const activeSlugs = winners.map((winner) => winner.slug);
  let inserted = 0;
  let updated = 0;

  for (const winner of winners) {
    const result = await upsertWinner(winner);
    if (result === "inserted") inserted += 1;
    if (result === "updated") updated += 1;
  }

  const archived = await archiveMissingWinners(activeSlugs);
  const publishedCount = await verifyImportedCount(activeSlugs);

  console.log(
    JSON.stringify(
      {
        sourceCount: winners.length,
        publishedCount,
        inserted,
        updated,
        archived,
        sample: winners.slice(0, 3).map((winner) => ({
          slug: winner.slug,
          recipientName: winner.recipientName,
          awardTitle: winner.awardTitle,
          year: winner.year,
        })),
      },
      null,
      2,
    ),
  );
}

await main();
