import "dotenv/config";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { eq, like } from "drizzle-orm";
import { db, schema } from "../src/lib/db";
import { uploadBufferToR2 } from "../src/lib/admin/r2";

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

function localAssetPath(value: string | null) {
  if (!value?.startsWith("/assets/")) return null;
  return join(process.cwd(), "public", value);
}

async function uploadLocalAsset(url: string, folder: string, cache: Map<string, string>) {
  const cached = cache.get(url);
  if (cached) return cached;

  const path = localAssetPath(url);
  if (!path) return url;

  const extension = extname(path).toLowerCase();
  const contentType = contentTypes[extension];
  if (!contentType) return url;

  const result = await uploadBufferToR2({
    body: new Uint8Array(await readFile(path)),
    contentType,
    folder,
    filename: path.split("/").pop(),
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  cache.set(url, result.url);
  return result.url;
}

const cache = new Map<string, string>();

const winners = await db.select().from(schema.pastWinners).where(like(schema.pastWinners.imageUrl, "/assets/%"));
for (const winner of winners) {
  const url = await uploadLocalAsset(winner.imageUrl, "winners", cache);
  await db.update(schema.pastWinners).set({ imageUrl: url, updatedAt: new Date() }).where(eq(schema.pastWinners.id, winner.id));
}

const nominations = await db.select().from(schema.nominations).where(like(schema.nominations.imageUrl, "/assets/%"));
for (const nomination of nominations) {
  const url = await uploadLocalAsset(nomination.imageUrl, "nominations", cache);
  await db.update(schema.nominations).set({ imageUrl: url, updatedAt: new Date() }).where(eq(schema.nominations.id, nomination.id));
}

console.log(`Migrated ${winners.length} winner images and ${nominations.length} nomination images to R2.`);
