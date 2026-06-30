export type WinnerRichTextValue = string | number | boolean | null | WinnerRichTextValue[] | WinnerRichTextAttributes;

export interface WinnerRichTextAttributes {
  [key: string]: WinnerRichTextValue;
}

export interface WinnerRichTextMark {
  type: string;
  attrs?: WinnerRichTextAttributes;
}

export interface WinnerRichTextNode {
  type: string;
  attrs?: WinnerRichTextAttributes;
  content?: WinnerRichTextNode[];
  marks?: WinnerRichTextMark[];
  text?: string;
}

export type WinnerRichText = WinnerRichTextNode;

export type WinnerRecipientType = "person" | "organization" | "creative_work";
export type WinnerArticleType = "article" | "news";
export type WinnerIndexingStatus = "noindex" | "index";

export type WinnerStoryRecord = {
  id?: string;
  awardTitle?: string | null;
  recipientName?: string | null;
  organization?: string | null;
  category?: string | null;
  year?: number | null;
  slug?: string | null;
  status?: string | null;
  recipientType?: WinnerRecipientType | null;
  articleType?: WinnerArticleType | null;
  headline?: string | null;
  standfirst?: string | null;
  body?: WinnerRichText | string | null;
  industry?: string | null;
  officialWebsiteUrl?: string | null;
  linkedinUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  awardCitation?: string | null;
  achievementHighlights?: string[] | null;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  heroImageCaption?: string | null;
  heroImageCredit?: string | null;
  socialImageUrl?: string | null;
  authorName?: string | null;
  publishedAt?: Date | string | null;
  contentUpdatedAt?: Date | string | null;
  factCheckedAt?: Date | string | null;
  indexingStatus?: WinnerIndexingStatus | null;
  sourceNotes?: string[] | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type WinnerQualityIssueSeverity = "error" | "warning";

export type WinnerQualityIssue = {
  field: keyof WinnerStoryRecord | "bodyText";
  message: string;
  severity: WinnerQualityIssueSeverity;
};

export type WinnerQualityReport = {
  indexable: boolean;
  issues: WinnerQualityIssue[];
  wordCount: number;
};
