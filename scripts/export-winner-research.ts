import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";

const outputDir = join(process.cwd(), "content", "winner-research", "2025");

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

async function main() {
  const winners = await db
    .select({
      id: schema.pastWinners.id,
      slug: schema.pastWinners.slug,
      recipientName: schema.pastWinners.recipientName,
      organization: schema.pastWinners.organization,
      awardTitle: schema.pastWinners.awardTitle,
      category: schema.pastWinners.category,
      year: schema.pastWinners.year,
      imageUrl: schema.pastWinners.imageUrl,
      summary: schema.pastWinners.summary,
      sortOrder: schema.pastWinners.sortOrder,
      updatedAt: schema.pastWinners.updatedAt,
    })
    .from(schema.pastWinners)
    .where(eq(schema.pastWinners.status, "published"))
    .orderBy(desc(schema.pastWinners.year), asc(schema.pastWinners.sortOrder), desc(schema.pastWinners.updatedAt));

  await mkdir(outputDir, { recursive: true });

  await Promise.all(
    winners.map((winner, index) =>
      writeFile(
        join(outputDir, `${String(index + 1).padStart(2, "0")}-${safeFileName(winner.slug)}.json`),
        `${JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            winner,
            research: {
              recipientType: null,
              officialSources: [],
              reputableSources: [],
              safeClaims: [],
              imageRisks: [],
              identityRisks: [],
            },
          },
          null,
          2,
        )}\n`,
      ),
    ),
  );

  console.log(JSON.stringify({ outputDir, exported: winners.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
