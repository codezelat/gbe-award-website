import { eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";

type SourceResult = {
  url: string;
  status: number;
  finalUrl: string;
  host: string;
  title: string;
  description: string;
};

const URL_PATTERN = /https?:\/\/[^\s)]+/;

function sourceUrl(value: string) {
  const match = value.match(URL_PATTERN)?.[0]?.replace(/[.,;]+$/, "");
  return match || null;
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function metaValue(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameFirst = new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)`, "i").exec(html)?.[1];
  const contentFirst = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["']`, "i").exec(html)?.[1];
  return cleanText(nameFirst || contentFirst || "");
}

async function inspectSource(url: string): Promise<SourceResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "GBEAwardsEditorialAudit/1.0 (+https://gbeaward.com/)" },
    });
    const html = (await response.text()).slice(0, 100_000);
    const finalUrl = response.url;
    const host = new URL(finalUrl).hostname.replace(/^www\./, "");
    const title = cleanText(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "").slice(0, 160);
    const description = (metaValue(html, "description") || metaValue(html, "og:description") || metaValue(html, "twitter:description")).slice(0, 280);

    return { url, status: response.status, finalUrl, host, title, description };
  } catch {
    return { url, status: 0, finalUrl: "", host: "", title: "", description: "" };
  } finally {
    clearTimeout(timeout);
  }
}

async function inBatches<T, R>(items: T[], batchSize: number, task: (item: T) => Promise<R>) {
  const result: R[] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    result.push(...(await Promise.all(items.slice(index, index + batchSize).map(task))));
  }
  return result;
}

const winners = await db
  .select({
    slug: schema.pastWinners.slug,
    recipientName: schema.pastWinners.recipientName,
    awardTitle: schema.pastWinners.awardTitle,
    officialWebsiteUrl: schema.pastWinners.officialWebsiteUrl,
    sourceNotes: schema.pastWinners.sourceNotes,
  })
  .from(schema.pastWinners)
  .where(eq(schema.pastWinners.status, "published"));

const urls = [
  ...new Set(
    winners.flatMap((winner) => [winner.officialWebsiteUrl, ...(winner.sourceNotes || [])].flatMap((value) => (value ? [sourceUrl(value)] : [])).filter(Boolean)),
  ),
] as string[];
const sources = await inBatches(urls, 6, inspectSource);
const byUrl = new Map(sources.map((source) => [source.url, source]));

const records = winners.map((winner) => {
  const references = [winner.officialWebsiteUrl, ...(winner.sourceNotes || [])]
    .flatMap((value) => (value ? [sourceUrl(value)] : []))
    .filter(Boolean) as string[];
  const evidence = [...new Map(references.map((url) => [url, byUrl.get(url)])).values()].filter(Boolean) as SourceResult[];

  return {
    slug: winner.slug,
    recipientName: winner.recipientName,
    awardTitle: winner.awardTitle,
    totalSources: evidence.length,
    reachableSources: evidence.filter((source) => source.status >= 200 && source.status < 300).length,
    sources: evidence,
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    winners: records.length,
    distinctSources: sources.length,
    reachableSources: sources.filter((source) => source.status >= 200 && source.status < 300).length,
    unreachableSources: sources.filter((source) => source.status < 200 || source.status >= 300).length,
  },
  records,
};

console.log(JSON.stringify(report, null, 2));
