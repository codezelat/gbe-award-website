import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { db, schema } from "../src/lib/db";
import { winnerInputSchema } from "../src/lib/admin/content";
import { assertCompleteRegister, parseAwardRegister, prepareWinner, validatePreparedWinners, type WinnerBatchDraft } from "./lib/winner-batch";

function argument(name: string) { const index = process.argv.indexOf(name); if (index < 0 || !process.argv[index + 1] || process.argv[index + 1].startsWith("--")) throw new Error(`Missing ${name}`); return process.argv[index + 1]; }
const apply = process.argv.includes("--apply");
const input = resolve(argument("--input"));
const registerPath = resolve(argument("--register"));
const reportPath = resolve(argument("--report"));
const year = Number(argument("--year"));
const expectedCount = Number(argument("--expected-count"));
const reviewedAt = new Date(argument("--reviewed-at"));
if (year !== 2026 || expectedCount !== 125 || Number.isNaN(reviewedAt.getTime())) throw new Error("This import is restricted to the approved 125-entry 2026 batch.");
const registerText = await readFile(registerPath, "utf8");
const register = parseAwardRegister(registerText);
const drafts: WinnerBatchDraft[] = JSON.parse(await readFile(input, "utf8"));
assertCompleteRegister(register, drafts, expectedCount);
const existing = await db.select().from(schema.pastWinners);
const rows = drafts.map((draft) => prepareWinner(draft, year, reviewedAt));
for (const row of rows) winnerInputSchema.parse(row);
validatePreparedWinners(rows, existing);
const existingIds = new Map(existing.map((row) => [row.id, row]));
const conflicts = rows.filter((row) => existingIds.has(row.id));
// A second run is an audit, never an implicit editorial overwrite.
for (const row of conflicts) {
  const current = existingIds.get(row.id)!;
  for (const key of ["recipientName", "awardTitle", "year", "slug", "headline", "standfirst", "imageUrl", "indexingStatus", "status", "seoTitle", "seoDescription"] as const) if (current[key] !== row[key]) throw new Error(`Existing batch conflict: ${row.id} (${key})`);
  if (!isDeepStrictEqual(current.body, row.body)) throw new Error(`Existing batch body conflict: ${row.id}`);
}
if (conflicts.length > 0 && conflicts.length !== expectedCount) throw new Error("Partial prior batch detected. Review manually; no writes made.");
const before = existing.filter((row) => !rows.some((item) => item.id === row.id)).sort((a, b) => a.id.localeCompare(b.id));
const checksum = (data: unknown) => createHash("sha256").update(JSON.stringify(data)).digest("hex");
const beforeChecksum = checksum(before);
await mkdir(dirname(reportPath), { recursive: true });
const backupPath = reportPath.replace(/\.json$/, "") + "-before.json";
if (apply && !conflicts.length) {
  await writeFile(backupPath, JSON.stringify(existing, null, 2), { flag: "wx", mode: 0o600 });
  // A single INSERT statement is atomic and contains no UPDATE/DELETE path.
  const inserted = await db.insert(schema.pastWinners).values(rows).returning({ id: schema.pastWinners.id });
  if (inserted.length !== expectedCount) throw new Error("Unexpected inserted count.");
}
const after = await db.select().from(schema.pastWinners);
if (apply) {
  for (const row of rows) {
    const saved = after.find((item) => item.id === row.id);
    if (!saved || saved.status !== "published" || saved.imageUrl !== row.imageUrl || !isDeepStrictEqual(saved.body, row.body)) throw new Error(`Read-back mismatch: ${row.id}`);
  }
}
const oldAfter = after.filter((row) => !rows.some((item) => item.id === row.id)).sort((a, b) => a.id.localeCompare(b.id));
if (checksum(oldAfter) !== beforeChecksum) throw new Error("Existing records changed during import. Inspect the backup and database immediately.");
const report = {
  mode: apply ? (conflicts.length ? "already-imported-no-changes" : "inserted") : "dry-run",
  year, expectedCount, registerSha256: checksum(registerText),
  priorRecords: before.length, priorRecordsChecksum: beforeChecksum, previousRecordsUnchanged: true,
  totalRecords: after.length, backupPath: apply && !conflicts.length ? backupPath : null,
  indexed: rows.filter((row) => row.indexingStatus === "index").length,
  noindex: rows.filter((row) => row.indexingStatus === "noindex").length,
  realImages: drafts.filter((draft) => draft.imageKind !== "nameplate").length,
  nameTreatments: drafts.filter((draft) => draft.imageKind === "nameplate").length,
  records: rows.map((row) => ({ id: row.id, recipientName: row.recipientName, awardTitle: row.awardTitle, path: `/previous-winners/${row.slug}`, indexingStatus: row.indexingStatus, imageUrl: row.imageUrl, imageKind: drafts.find((draft) => draft.index === row.sortOrder)!.imageKind, reviewNote: drafts.find((draft) => draft.index === row.sortOrder)!.reviewNote })),
};
await writeFile(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ ...report, records: undefined }, null, 2));
