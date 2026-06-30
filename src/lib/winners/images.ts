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

function normalizeImageUrl(value: string | null | undefined) {
  const imageUrl = value?.trim();
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl, "https://gbeaward.com");
    url.hash = "";
    url.search = "";
    return url.href;
  } catch {
    return imageUrl;
  }
}

export function pickDistinctWinnerBannerImage(heroImageUrl: string | null | undefined, profileImageUrl: string | null | undefined) {
  const bannerImage = pickRealWinnerImage(heroImageUrl);
  if (!bannerImage) return null;

  const profileImage = pickRealWinnerImage(profileImageUrl);
  if (!profileImage) return bannerImage;

  return normalizeImageUrl(bannerImage) === normalizeImageUrl(profileImage) ? null : bannerImage;
}
