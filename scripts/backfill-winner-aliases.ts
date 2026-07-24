import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";
import { buildLegacyWinnerRootSlug } from "../src/lib/winners/content";

const RESERVED_ROOT_SLUGS = new Set([
  "about",
  "contact",
  "gbe-admin-safe",
  "nominees",
  "previous-winners",
  "privacy-policy",
  "sitemap.xml",
]);

function isSafeLegacyAlias(value: string) {
  return (
    value.length <= 180 &&
    /^[a-z0-9]+(?:-[a-z0-9]+){2,}$/.test(value) &&
    !RESERVED_ROOT_SLUGS.has(value)
  );
}

function legacyRootSlugFromSource(value: string) {
  try {
    const url = new URL(value);
    if (
      url.hostname !== "gbeaward.com" &&
      url.hostname !== "www.gbeaward.com"
    ) {
      return null;
    }
    const segments = url.pathname.split("/").filter(Boolean);
    const slug = segments.length === 1 ? segments[0] : null;
    return slug && isSafeLegacyAlias(slug) ? slug : null;
  } catch {
    return null;
  }
}

async function main() {
  const dryRun = process.env.DRY_RUN === "true";
  const verbose = process.env.VERBOSE === "true";
  const [winners, existingAliases] = await Promise.all([
    db
      .select({
        id: schema.pastWinners.id,
        slug: schema.pastWinners.slug,
        recipientName: schema.pastWinners.recipientName,
        awardTitle: schema.pastWinners.awardTitle,
        sourceNotes: schema.pastWinners.sourceNotes,
      })
      .from(schema.pastWinners),
    db
      .select({
        alias: schema.winnerSlugAliases.alias,
        winnerId: schema.winnerSlugAliases.winnerId,
      })
      .from(schema.winnerSlugAliases),
  ]);

  const canonicalOwners = new Map(
    winners.map((winner) => [winner.slug, winner.id]),
  );
  const aliasOwners = new Map(
    existingAliases.map((alias) => [alias.alias, alias.winnerId]),
  );
  const candidates = new Map<string, string>();
  let skippedConflicts = 0;

  for (const winner of winners) {
    const aliases = new Set<string>([
      buildLegacyWinnerRootSlug(winner.recipientName, winner.awardTitle),
      ...(winner.sourceNotes ?? [])
        .map(legacyRootSlugFromSource)
        .filter((slug): slug is string => Boolean(slug)),
    ]);

    for (const alias of aliases) {
      if (
        !alias ||
        !isSafeLegacyAlias(alias) ||
        alias === winner.slug
      ) {
        continue;
      }
      const canonicalOwner = canonicalOwners.get(alias);
      const aliasOwner = aliasOwners.get(alias) ?? candidates.get(alias);

      if (
        (canonicalOwner && canonicalOwner !== winner.id) ||
        (aliasOwner && aliasOwner !== winner.id)
      ) {
        skippedConflicts += 1;
        continue;
      }

      if (!aliasOwner) candidates.set(alias, winner.id);
    }
  }

  if (!dryRun && candidates.size > 0) {
    await db
      .insert(schema.winnerSlugAliases)
      .values(
        [...candidates].map(([alias, winnerId]) => ({ alias, winnerId })),
      )
      .onConflictDoNothing();
  }

  const [countRow] = await db
    .select({ winnerId: schema.winnerSlugAliases.winnerId })
    .from(schema.winnerSlugAliases)
    .where(eq(schema.winnerSlugAliases.alias, ""))
    .limit(1);

  console.log(
    JSON.stringify(
      {
        winners: winners.length,
        existingAliases: existingAliases.length,
        candidateAliases: candidates.size,
        insertedAliases: dryRun ? 0 : candidates.size,
        skippedConflicts,
        invalidEmptyAliasPresent: Boolean(countRow),
        dryRun,
      },
      null,
      2,
    ),
  );

  if (dryRun && verbose && candidates.size > 0) {
    const winnerSlugs = new Map(
      winners.map((winner) => [winner.id, winner.slug]),
    );
    console.log(
      JSON.stringify(
        [...candidates]
          .map(([alias, winnerId]) => ({
            alias,
            canonicalSlug: winnerSlugs.get(winnerId),
          }))
          .sort((left, right) => left.alias.localeCompare(right.alias)),
        null,
        2,
      ),
    );
  }
}

await main();
