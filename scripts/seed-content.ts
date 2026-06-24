import "dotenv/config";
import { eq } from "drizzle-orm";
import { featuredNominees, nomineeEntries } from "../src/data/home";
import { db, schema } from "../src/lib/db";
import { slugify } from "../src/lib/admin/content";

const winnerSeed = featuredNominees.slice(0, 8).map((item, index) => ({
  awardTitle: item.title,
  recipientName: item.name,
  organization: item.name.includes(" - ") ? item.name.split(" - ")[0] : null,
  category: "Global Business Excellence",
  year: 2026,
  market: index % 2 === 0 ? "Sri Lanka" : "International",
  summary: "Recognised by the Global Business Excellence Awards for outstanding achievement and measurable impact.",
  imageUrl: item.image,
  slug: slugify(`${item.name}-${item.title}-winner-${index}`),
  status: "published" as const,
  sortOrder: index,
  seoTitle: `${item.name} | GBE Awards Winner`,
  seoDescription: `${item.name} recognised by the Global Business Excellence Awards.`,
}));

const nominationSeed = [...featuredNominees, ...nomineeEntries].map((item, index) => ({
  awardTitle: item.title,
  nomineeName: item.name,
  organization: item.name.includes(" - ") ? item.name.split(" - ")[0] : null,
  category: "Global Business Excellence",
  year: 2026,
  market: index % 3 === 0 ? "UK" : index % 3 === 1 ? "Sri Lanka" : "International",
  summary: "Nomination record for the Global Business Excellence Awards 2026.",
  notes: "",
  imageUrl: item.image,
  slug: slugify(`${item.name}-${item.title}-nominee-${index}`),
  status: index < 8 ? ("shortlisted" as const) : ("submitted" as const),
  sortOrder: index,
  seoTitle: `${item.name} | GBE Awards Nominee`,
  seoDescription: `${item.name} nominated for the Global Business Excellence Awards 2026.`,
}));

for (const winner of winnerSeed) {
  const existing = await db.select({ id: schema.pastWinners.id }).from(schema.pastWinners).where(eq(schema.pastWinners.slug, winner.slug)).limit(1);
  if (!existing[0]) {
    await db.insert(schema.pastWinners).values(winner);
  }
}

for (const nomination of nominationSeed) {
  const existing = await db.select({ id: schema.nominations.id }).from(schema.nominations).where(eq(schema.nominations.slug, nomination.slug)).limit(1);
  if (!existing[0]) {
    await db.insert(schema.nominations).values(nomination);
  }
}

console.log(`Seeded ${winnerSeed.length} winners and ${nominationSeed.length} nominations if missing.`);
