import sanitizeHtml from "sanitize-html";
import type { WinnerQualityIssue, WinnerQualityReport, WinnerRichText, WinnerRichTextMark, WinnerRichTextNode, WinnerStoryRecord } from "./types";

const MIN_INDEXABLE_WORDS = 250;
const MAX_RICH_TEXT_BYTES = 180_000;
const MAX_RICH_TEXT_DEPTH = 12;
const ALLOWED_RICH_TEXT_NODES = new Set(["doc", "paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote", "text"]);
const ALLOWED_RICH_TEXT_MARKS = new Set(["bold", "italic", "link"]);

const ALLOWED_TAGS = ["p", "h2", "h3", "ul", "ol", "li", "strong", "em", "blockquote", "a"];
const ALLOWED_SCHEMES = ["http", "https", "mailto"];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value: string) {
  return normalizeWhitespace(value.replace(/<[^>]*>/g, " "));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value: string) {
  return normalizeWhitespace(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasSafeRichTextAttributes(value: unknown, depth = 0): boolean {
  if (depth > 4) return false;
  if (value === undefined || value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) return value.every((item) => hasSafeRichTextAttributes(item, depth + 1));
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => hasSafeRichTextAttributes(item, depth + 1));
}

function isValidRichTextNode(value: unknown, depth = 0): value is WinnerRichTextNode {
  if (!isRecord(value) || depth > MAX_RICH_TEXT_DEPTH || typeof value.type !== "string" || !ALLOWED_RICH_TEXT_NODES.has(value.type)) {
    return false;
  }

  if (value.text !== undefined && (typeof value.text !== "string" || value.text.length > 20_000)) return false;
  if (value.attrs !== undefined && !hasSafeRichTextAttributes(value.attrs)) return false;

  if (value.marks !== undefined) {
    if (!Array.isArray(value.marks)) return false;
    if (!value.marks.every((mark) => isRecord(mark) && typeof mark.type === "string" && ALLOWED_RICH_TEXT_MARKS.has(mark.type) && hasSafeRichTextAttributes(mark.attrs))) {
      return false;
    }
  }

  if (value.content !== undefined) {
    if (!Array.isArray(value.content) || value.content.length > 2_500) return false;
    return value.content.every((node) => isValidRichTextNode(node, depth + 1));
  }

  return value.type === "text" || value.type === "doc" || value.type === "paragraph" || value.type === "heading";
}

/** Ensures the JSON stored from the admin editor is a bounded, renderable document. */
export function isValidWinnerRichText(value: unknown): value is WinnerRichText {
  if (!isValidRichTextNode(value) || value.type !== "doc") return false;

  try {
    return JSON.stringify(value).length <= MAX_RICH_TEXT_BYTES;
  } catch {
    return false;
  }
}

function renderMarks(text: string, marks?: WinnerRichTextMark[]) {
  let output = escapeHtml(text);

  for (const mark of marks ?? []) {
    if (mark.type === "bold") {
      output = `<strong>${output}</strong>`;
    }

    if (mark.type === "italic") {
      output = `<em>${output}</em>`;
    }

    if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
      if (href) {
        output = `<a href="${escapeHtml(href)}">${output}</a>`;
      }
    }
  }

  return output;
}

function renderChildren(node: WinnerRichTextNode) {
  return (node.content ?? []).map(renderNode).join("");
}

function renderListItems(node: WinnerRichTextNode) {
  return (node.content ?? [])
    .filter((child) => child.type === "listItem")
    .map(renderNode)
    .join("");
}

function renderNode(node: WinnerRichTextNode): string {
  if (node.type === "text") {
    return renderMarks(node.text ?? "", node.marks);
  }

  if (node.type === "doc") {
    return renderChildren(node);
  }

  if (node.type === "paragraph") {
    const content = renderChildren(node);
    return content.trim() ? `<p>${content}</p>` : "";
  }

  if (node.type === "heading") {
    const level = node.attrs?.level === 3 ? 3 : 2;
    const content = renderChildren(node);
    return content.trim() ? `<h${level}>${content}</h${level}>` : "";
  }

  if (node.type === "bulletList") {
    const content = renderListItems(node);
    return content.trim() ? `<ul>${content}</ul>` : "";
  }

  if (node.type === "orderedList") {
    const content = renderListItems(node);
    return content.trim() ? `<ol>${content}</ol>` : "";
  }

  if (node.type === "listItem") {
    const content = renderChildren(node);
    return content.trim() ? `<li>${content}</li>` : "";
  }

  if (node.type === "blockquote") {
    const content = renderChildren(node);
    return content.trim() ? `<blockquote>${content}</blockquote>` : "";
  }

  return "";
}

function bodyToHtml(body: WinnerStoryRecord["body"]) {
  if (!body) return "";
  if (typeof body === "string") return sanitizeWinnerHtml(body);
  if (!isRecord(body) || typeof body.type !== "string") return "";
  return renderWinnerRichText(body as WinnerRichText);
}

function countWords(value: string) {
  const text = stripHtml(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function textFromNode(node: WinnerRichTextNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textFromNode).join(" ");
}

function collectParagraphs(node: WinnerRichTextNode, output: string[]) {
  if (node.type === "paragraph") {
    const text = normalizeWhitespace(textFromNode(node));
    if (text) output.push(text);
  }

  for (const child of node.content ?? []) collectParagraphs(child, output);
}

/** Returns substantial body paragraphs for editorial reuse checks. */
export function getWinnerBodyParagraphs(body: WinnerStoryRecord["body"]): string[] {
  if (!body) return [];

  if (typeof body === "string") {
    return sanitizeWinnerHtml(body)
      .split(/<\/p>/i)
      .map((paragraph) => normalizeWhitespace(stripHtml(paragraph)))
      .filter(Boolean);
  }

  if (!isValidWinnerRichText(body)) return [];
  const paragraphs: string[] = [];
  collectParagraphs(body, paragraphs);
  return paragraphs;
}

function paragraphFingerprint(value: string) {
  return normalizeWhitespace(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export type WinnerParagraphReuse = {
  paragraph: string;
  matchingWinnerIds: string[];
};

/** Finds verbatim substantial paragraphs reused between a candidate and other winner stories. */
export function findWinnerParagraphReuse(
  candidate: WinnerStoryRecord,
  existing: WinnerStoryRecord[],
  minCharacters = 140,
): WinnerParagraphReuse[] {
  const candidateParagraphs = getWinnerBodyParagraphs(candidate.body)
    .filter((paragraph) => paragraph.length >= minCharacters);
  const existingByParagraph = new Map<string, Set<string>>();

  for (const winner of existing) {
    if (!winner.id || winner.id === candidate.id) continue;
    for (const paragraph of getWinnerBodyParagraphs(winner.body).filter((item) => item.length >= minCharacters)) {
      const fingerprint = paragraphFingerprint(paragraph);
      if (!fingerprint) continue;
      const ids = existingByParagraph.get(fingerprint) ?? new Set<string>();
      ids.add(winner.id);
      existingByParagraph.set(fingerprint, ids);
    }
  }

  return candidateParagraphs.flatMap((paragraph) => {
    const matchingWinnerIds = [...(existingByParagraph.get(paragraphFingerprint(paragraph)) ?? [])];
    return matchingWinnerIds.length > 0 ? [{ paragraph, matchingWinnerIds }] : [];
  });
}

function hasUsableText(value: unknown, minLength = 1) {
  return typeof value === "string" && normalizeWhitespace(value).length >= minLength;
}

function hasUsableDate(value: unknown) {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function addIssue(issues: WinnerQualityIssue[], field: WinnerQualityIssue["field"], message: string) {
  issues.push({ field, message, severity: "error" });
}

export function buildWinnerSlug(recipient: string, award: string, year: number): string {
  const base = `${recipient} wins ${award} ${year}`;
  return slugify(base);
}

/** Matches the root-level URL shape used by the legacy WordPress winner pages. */
export function buildLegacyWinnerRootSlug(recipient: string, award: string): string {
  return slugify(`${recipient} ${award}`);
}

export function deriveDisplayAwardTitle(winner: Pick<WinnerStoryRecord, "recipientName" | "awardTitle" | "headline">): string {
  const fallback = normalizeWhitespace(winner.awardTitle || "Global Business Excellence Awards winner");
  const headline = normalizeWhitespace(winner.headline || "");
  const recipient = normalizeWhitespace(winner.recipientName || "");

  if (!headline || !recipient) return fallback;

  const escapedRecipient = recipient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cleaned = headline.replace(new RegExp(`^${escapedRecipient}\\s+wins\\s+`, "i"), "").trim();
  return cleaned && cleaned !== headline ? cleaned : fallback;
}

export function sanitizeWinnerHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ALLOWED_SCHEMES,
    disallowedTagsMode: "discard",
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          href: attribs.href ?? "",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      h1: "h2",
      h4: "h3",
      h5: "h3",
      h6: "h3",
    },
  }).trim();
}

export function renderWinnerRichText(document: WinnerRichText): string {
  return sanitizeWinnerHtml(renderNode(document));
}

export function evaluateWinnerQuality(winner: WinnerStoryRecord): WinnerQualityReport {
  const issues: WinnerQualityIssue[] = [];
  const bodyHtml = bodyToHtml(winner.body);
  const wordCount = countWords(bodyHtml);

  if (!hasUsableText(winner.recipientName)) addIssue(issues, "recipientName", "Recipient name is required.");
  if (!hasUsableText(winner.awardTitle)) addIssue(issues, "awardTitle", "Award title is required.");
  if (!hasUsableText(winner.headline, 35)) addIssue(issues, "headline", "Headline must clearly describe the award win.");
  if (!hasUsableText(winner.standfirst, 80)) addIssue(issues, "standfirst", "Standfirst must summarize the story in enough detail.");
  if (!hasUsableText(winner.seoTitle, 35)) addIssue(issues, "seoTitle", "SEO title is required.");
  if (!hasUsableText(winner.seoDescription, 80)) addIssue(issues, "seoDescription", "SEO description is required.");
  if (!hasUsableText(winner.authorName, 3)) addIssue(issues, "authorName", "A named author or editorial team is required.");
  if (!hasUsableText(winner.heroImageAlt, 20)) addIssue(issues, "heroImageAlt", "Hero image alt text is required.");
  if (!Array.isArray(winner.sourceNotes) || winner.sourceNotes.filter((source) => hasUsableText(source, 8)).length === 0) {
    addIssue(issues, "sourceNotes", "At least one source note is required.");
  }
  if (!hasUsableDate(winner.publishedAt)) addIssue(issues, "publishedAt", "Published date is required.");
  if (!hasUsableDate(winner.factCheckedAt)) addIssue(issues, "factCheckedAt", "Fact-check date is required.");
  if (wordCount < MIN_INDEXABLE_WORDS) {
    addIssue(issues, "bodyText", `Article body must contain at least ${MIN_INDEXABLE_WORDS} meaningful words.`);
  }

  return {
    indexable: issues.length === 0,
    issues,
    wordCount,
  };
}

export function buildWinnerKeywordCluster(winner: WinnerStoryRecord): string[] {
  const candidates = [
    winner.recipientName,
    winner.awardTitle,
    winner.year ? `${winner.recipientName ?? ""} ${winner.awardTitle ?? ""} ${winner.year}` : null,
    winner.organization,
    winner.category,
    winner.industry,
    "Global Business Excellence Awards winner",
  ];

  return Array.from(
    new Set(
      candidates
        .filter((value): value is string => hasUsableText(value))
        .map(normalizeWhitespace),
    ),
  );
}
