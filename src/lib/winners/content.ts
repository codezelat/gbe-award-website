import sanitizeHtml from "sanitize-html";
import type { WinnerQualityIssue, WinnerQualityReport, WinnerRichText, WinnerRichTextMark, WinnerRichTextNode, WinnerStoryRecord } from "./types";

const MIN_INDEXABLE_WORDS = 250;

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
