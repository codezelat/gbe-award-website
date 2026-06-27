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
