import "dotenv/config";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { parseAwardRegister, assertCompleteRegister, type WinnerBatchDraft } from "./lib/winner-batch";
import { uploadBufferToR2 } from "../src/lib/admin/r2";

const arg = (name: string) => { const i = process.argv.indexOf(name); if (i < 0 || !process.argv[i + 1]) throw new Error(`Missing ${name}`); return process.argv[i + 1]; };
const sourceDir = resolve(arg("--source-dir"));
const register = parseAwardRegister(await readFile(resolve(arg("--register")), "utf8"));
const output = resolve(arg("--output"));
const upload = process.argv.includes("--upload");
type MediaChoice = { index: number; localPath: string; kind: "logo" | "portrait" | "programme" | "product"; source: string; credit: string; background?: string };
const mediaChoices: MediaChoice[] = process.argv.includes("--media-overrides") ? JSON.parse(await readFile(resolve(arg("--media-overrides")), "utf8")) : [];
if (new Set(mediaChoices.map((m) => m.index)).size !== mediaChoices.length) throw new Error("Duplicate media choice");
const allProfiles: Record<number, any> = {};
for (const range of ["001-015", "016-030", "031-045", "046-060", "061-075", "076-090", "091-105", "106-125"]) {
  const { profiles } = await import(pathToFileURL(join(sourceDir, `profiles-${range}.ts`)).href);
  for (const [index, profile] of Object.entries(profiles)) {
    if (allProfiles[Number(index)]) throw new Error(`Repeated editorial entry ${index}`);
    allProfiles[Number(index)] = profile;
  }
}
await mkdir(join(sourceDir, "media"), { recursive: true });
const cachePath = join(sourceDir, "media-manifest.json");
let cache: Record<string, string> = {};
try { cache = JSON.parse(await readFile(cachePath, "utf8")); } catch (error: any) { if (error.code !== "ENOENT") throw error; }

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const drafts: WinnerBatchDraft[] = [];
const mediaPaths: string[] = [];
for (const entry of register) {
  const profile = allProfiles[entry.index];
  if (!profile) throw new Error(`Missing editorial entry ${entry.index}`);
  const name = profile.name || entry.recipientName;
  // A typographic name treatment, not a fabricated logo or a synthetic portrait.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect width="800" height="800" fill="#f8f7f3"/><circle cx="400" cy="400" r="348" fill="#fff" stroke="#c4a45b" stroke-width="2"/><circle cx="400" cy="400" r="333" fill="none" stroke="#ece6d8" stroke-width="1"/><path d="M370 200h60M370 600h60" stroke="#b38d3f" stroke-width="3"/></svg>`;
  const choice = mediaChoices.find((m) => m.index === entry.index);
  const filename = `${String(entry.index).padStart(3, "0")}-${choice?.kind || "nameplate"}.webp`;
  const localPath = join(sourceDir, "media", filename);
  let body: Buffer;
  if (choice) {
    const original = await readFile(resolve(choice.localPath));
    const identity = await sharp(original).trim({ threshold: 12 }).resize(choice.kind === "portrait" ? 700 : 610, choice.kind === "portrait" ? 740 : 610, { fit: "inside" }).flatten({ background: choice.background || "#ffffff" }).toBuffer();
    body = await sharp({ create: { width: 800, height: 800, channels: 3, background: "#ffffff" } }).composite([{ input: identity, gravity: "centre" }]).webp({ quality: 88 }).toBuffer();
  } else {
    const label = await sharp({ text: { text: `<span foreground="#172c3b">${escape(name)}</span>`, font: "Arial 58", width: 550, height: 300, align: "centre", rgba: true, wrap: "word", spacing: 10 } }).png().toBuffer();
    body = await sharp(Buffer.from(svg)).composite([{ input: label, gravity: "centre" }]).webp({ quality: 88 }).toBuffer();
  }
  await writeFile(localPath, body);
  mediaPaths.push(localPath);
  const key = createHash("sha256").update(body).digest("hex");
  let imageUrl = cache[key];
  if (upload && !imageUrl) {
    const result = await uploadBufferToR2({ body, contentType: "image/webp", folder: "winners-2026", filename: `${entry.index}-${name}-${choice?.kind || "nameplate"}.webp` });
    if (!result.ok) throw new Error(result.error);
    imageUrl = result.url; cache[key] = imageUrl;
    await writeFile(cachePath, JSON.stringify(cache, null, 2));
  }
  drafts.push({ ...entry, recipientType: profile.type || "organization", industry: profile.industry,
    displayName: profile.name, organization: profile.organization || null, standfirst: profile.standfirst,
    sections: profile.sections.map(([heading, ...paragraphs]: string[]) => ({ heading, paragraphs })),
    sources: [...new Set([...(profile.sources || []), ...(choice?.source.startsWith("https://") ? [choice.source] : [])])], officialWebsiteUrl: profile.website || null,
    imageUrl: imageUrl || `file://${localPath}`, imageKind: choice?.kind || "nameplate", imageCredit: choice?.credit || "GBE Awards",
    indexingApproved: Boolean(profile.approved),
    reviewNote: `${profile.approved ? "Award confirmed by organiser; public identity/background sources reviewed." : "Award confirmed by organiser. Limited public background corroboration, held noindex."} ${choice ? `Selected ${choice.kind} visually reviewed; source: ${choice.source}` : "No suitable identity-matched non-award image confirmed after research; typographic name treatment used. No synthetic portrait or fabricated logo."}`,
  });
}
assertCompleteRegister(register, drafts, 125);
await writeFile(output, JSON.stringify(drafts, null, 2));
// An inspection contact sheet, separate from the published media.
const tiles = await Promise.all(register.map(async (entry, i) => ({ input: await sharp(mediaPaths[i]).resize(160, 160).toBuffer(), left: ((entry.index - 1) % 10) * 160, top: Math.floor((entry.index - 1) / 10) * 160 })));
await sharp({ create: { width: 1600, height: 2080, channels: 3, background: "#f8f7f3" } }).composite(tiles).png().toFile(join(sourceDir, "media-contact-sheet.png"));
console.log(JSON.stringify({ entries: drafts.length, uploaded: upload, indexApproved: drafts.filter((d) => d.indexingApproved).length, output }));
