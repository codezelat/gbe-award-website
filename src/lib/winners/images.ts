import { SITE_DEFAULT_OG_IMAGE } from "../site";

const fallbackImagePaths = new Set([
  SITE_DEFAULT_OG_IMAGE,
  "/assets/brand/award-icon.webp",
  "/assets/brand/gbe-logo-full.png",
]);

export function isRealWinnerImageUrl(value: string | null | undefined) {
  const imageUrl = value?.trim();
  if (!imageUrl) return false;

  try {
    const url = new URL(imageUrl, "https://gbeaward.com");
    return !fallbackImagePaths.has(url.pathname);
  } catch {
    return !fallbackImagePaths.has(imageUrl);
  }
}

export function pickRealWinnerImage(...values: Array<string | null | undefined>) {
  return values.find(isRealWinnerImageUrl) || null;
}
