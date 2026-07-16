type PublicCacheOptions = {
  browserMaxAge: number;
  cdnMaxAge: number;
  staleWhileRevalidate: number;
};

const DEFAULT_PUBLIC_CACHE: PublicCacheOptions = {
  browserMaxAge: 60,
  cdnMaxAge: 300,
  staleWhileRevalidate: 3600,
};

/**
 * Keeps short browser caching separate from the longer shared-CDN lifetime.
 * Vercel consumes its targeted header, while the generic CDN header remains
 * available to the site's edge proxy.
 */
export function setPublicResponseCache(
  headers: Headers,
  options: Partial<PublicCacheOptions> = {},
) {
  const cache = { ...DEFAULT_PUBLIC_CACHE, ...options };
  const sharedCacheValue = `public, s-maxage=${cache.cdnMaxAge}, stale-while-revalidate=${cache.staleWhileRevalidate}`;

  headers.set("Cache-Control", `public, max-age=${cache.browserMaxAge}, must-revalidate`);
  headers.set("CDN-Cache-Control", sharedCacheValue);
  headers.set("Vercel-CDN-Cache-Control", sharedCacheValue);
}
