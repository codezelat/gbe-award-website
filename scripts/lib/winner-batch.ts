import { createHash } from "node:crypto";
import { buildWinnerSlug, evaluateWinnerQuality, findWinnerParagraphReuse } from "../../src/lib/winners/content";
import type { WinnerRecipientType, WinnerRichText, WinnerStoryRecord } from "../../src/lib/winners/types";

export interface AwardRegisterEntry { index: number; recipientName: string; awardTitle: string }
export interface WinnerBatchDraft extends AwardRegisterEntry {
  recipientType: WinnerRecipientType;
  industry: string;
  organization?: string | null;
  displayName?: string;
  standfirst: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  sources: string[];
  officialWebsiteUrl?: string | null;
  imageUrl?: string | null;
  imageKind?: "logo" | "nameplate" | "portrait" | "programme" | "product";
  imageCredit?: string | null;
  indexingApproved: boolean;
  reviewNote: string;
}

export function parseAwardRegister(input: string): AwardRegisterEntry[] {
  return input.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => /^\d+\t/.test(line)).map((line) => {
    const [index, recipientName, awardTitle, ...extra] = line.split("\t");
    if (!recipientName?.trim() || !awardTitle?.trim() || extra.some((value) => value.trim())) throw new Error(`Invalid register row ${index}`);
    return { index: Number(index), recipientName: recipientName.trim(), awardTitle: awardTitle.trim() };
  });
}

export function assertCompleteRegister(register: AwardRegisterEntry[], drafts: WinnerBatchDraft[], expectedCount: number) {
  if (register.length !== expectedCount || drafts.length !== expectedCount) throw new Error(`Expected exactly ${expectedCount} award entries, found ${register.length} register rows and ${drafts.length} drafts.`);
  if (new Set(register.map((row) => row.index)).size !== expectedCount || new Set(drafts.map((row) => row.index)).size !== expectedCount) throw new Error("Duplicate input index.");
  for (let index = 1; index <= expectedCount; index++) {
    const approved = register.find((row) => row.index === index);
    const draft = drafts.find((row) => row.index === index);
    if (!approved || !draft || approved.recipientName !== draft.recipientName || approved.awardTitle !== draft.awardTitle) throw new Error(`Draft ${index} differs from the organiser-approved register.`);
    if (!draft.reviewNote?.trim()) throw new Error(`Missing private review for ${index}`);
    if (draft.indexingApproved && !draft.sources.some((source) => /^https:\/\//.test(source))) throw new Error(`Index approval requires a reviewed public source for ${index}`);
  }
}

export function draftBody(draft: WinnerBatchDraft, year: number): WinnerRichText {
  const intro = `${draft.recipientName} has received ${draft.awardTitle} at the Global Business Excellence Awards ${year}. Organised by London Business Consultancy, London, UK, the awards recognise businesses, professionals and creative work across a broad range of fields. For ${draft.displayName || draft.recipientName}, the ${year} recognition places the spotlight on ${draft.industry.toLowerCase()}.`;
  return {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: intro }] },
      ...draft.sections.flatMap((section) => [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: section.heading }] },
        ...section.paragraphs.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })),
      ]),
    ],
  };
}

export function prepareWinner(draft: WinnerBatchDraft, year: number, reviewedAt: Date) {
  const slug = buildWinnerSlug(draft.recipientName, draft.awardTitle, year);
  const safeSlug = slug.length <= 180 ? slug : `${slug.slice(0, 158).replace(/-+$/, "")}-${createHash("sha256").update(slug).digest("hex").slice(0, 8)}-${year}`;
  const name = draft.displayName || draft.recipientName;
  return {
    id: `gbe-${year}-${String(draft.index).padStart(3, "0")}`,
    recipientName: draft.recipientName, awardTitle: draft.awardTitle,
    organization: draft.organization || null,
    // Preserve the exact award category supplied by the organiser, rather than invent a new classification.
    category: draft.awardTitle,
    year, slug: safeSlug, status: "published" as const, sortOrder: draft.index,
    recipientType: draft.recipientType, articleType: "article" as const,
    industry: draft.industry,
    headline: `${name}: ${draft.awardTitle} at GBE Awards ${year}`,
    standfirst: draft.standfirst,
    summary: `${name} received ${draft.awardTitle} at the Global Business Excellence Awards ${year}.`,
    body: draftBody(draft, year),
    seoTitle: `${name}: ${draft.awardTitle} | GBE Awards ${year}`,
    seoDescription: `${name} receives ${draft.awardTitle} at GBE Awards ${year}. Explore the ${year} recognition and the work behind the name.`,
    authorName: "GBE Awards Editorial Team",
    officialWebsiteUrl: draft.officialWebsiteUrl || null,
    imageUrl: draft.imageUrl || null,
    heroImageUrl: null,
    heroImageAlt: draft.imageKind === "nameplate" ? `${name} name displayed inside a white circular typographic design` : `${name}, ${draft.imageKind || "identity image"} for the Global Business Excellence Awards ${year} recipient profile`,
    heroImageCaption: null,
    heroImageCredit: draft.imageCredit || null,
    socialImageUrl: draft.imageUrl || null,
    awardCitation: `${draft.recipientName}, ${draft.awardTitle}, Global Business Excellence Awards ${year}.`,
    achievementHighlights: [],
    sourceNotes: [`Global Business Excellence Awards ${year}: recipient and award title confirmed by the organiser.`, ...draft.sources],
    publishedAt: reviewedAt, factCheckedAt: reviewedAt, contentUpdatedAt: reviewedAt,
    indexingStatus: draft.indexingApproved ? "index" as const : "noindex" as const,
  };
}

export function validatePreparedWinners(rows: ReturnType<typeof prepareWinner>[], existing: WinnerStoryRecord[]) {
  if (new Set(rows.map((row) => row.slug)).size !== rows.length) throw new Error("Duplicate article slug in batch.");
  const otherIds = new Set(existing.filter((row) => !rows.some((newRow) => newRow.id === row.id)).map((row) => row.slug));
  const all = [...existing, ...rows];
  for (const row of rows) {
    if (otherIds.has(row.slug)) throw new Error(`Slug is already owned by another record: ${row.slug}`);
    const quality = evaluateWinnerQuality(row);
    if (!quality.indexable) throw new Error(`${row.id}: ${quality.issues.map((issue) => issue.message).join(" ")}`);
    if (findWinnerParagraphReuse(row, all).length) throw new Error(`Repeated substantial article paragraph in ${row.id}`);
    if (!row.body || !row.standfirst || !row.imageUrl) throw new Error(`Incomplete public record: ${row.id}`);
  }
}
