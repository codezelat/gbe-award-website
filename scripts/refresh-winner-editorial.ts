import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";
import { findWinnerParagraphReuse } from "../src/lib/winners/content";
import { buildWinnerEditorialUpdate, winnerEditorialWordCount } from "../src/lib/winners/editorial";

const apply = process.argv.includes("--apply");
const checkedAt = new Date();

const winners = await db.select().from(schema.pastWinners).where(eq(schema.pastWinners.status, "published"));
const planned = winners.map((winner) => ({ winner, update: buildWinnerEditorialUpdate(winner) }));

if (planned.some(({ update }) => winnerEditorialWordCount(update) < 350)) {
  throw new Error("Editorial refresh stopped because a generated article fell below the 350-word source-grounded minimum.");
}

const proposedStories = planned.map(({ winner, update }) => ({ ...winner, ...update }));
const reusedParagraphs = proposedStories.flatMap((candidate) => findWinnerParagraphReuse(candidate, proposedStories));
if (reusedParagraphs.length > 0) {
  throw new Error(
    `Editorial refresh stopped because ${reusedParagraphs.length} substantial paragraph(s) would be duplicated across winner stories: ${reusedParagraphs
      .slice(0, 3)
      .map((reuse) => reuse.paragraph.slice(0, 80))
      .join(" | ")}`,
  );
}

if (apply) {
  for (const { winner, update } of planned) {
    await db
      .update(schema.pastWinners)
      .set({
        ...update,
        contentUpdatedAt: checkedAt,
        factCheckedAt: checkedAt,
        updatedAt: checkedAt,
      })
      .where(eq(schema.pastWinners.id, winner.id));
  }
}

console.log(
  JSON.stringify(
    {
      mode: apply ? "applied" : "dry-run",
      publishedWinners: planned.length,
      minimumWordCount: Math.min(...planned.map(({ update }) => winnerEditorialWordCount(update))),
      maximumWordCount: Math.max(...planned.map(({ update }) => winnerEditorialWordCount(update))),
      sample: planned.slice(0, 3).map(({ winner, update }) => ({
        slug: winner.slug,
        headline: update.headline,
        wordCount: winnerEditorialWordCount(update),
      })),
    },
    null,
    2,
  ),
);
