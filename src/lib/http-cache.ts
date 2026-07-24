type PublicCacheOptions = {
  browserMaxAge: number;
  downstreamMaxAge: number;
  vercelMaxAge: number;
  staleWhileRevalidate: number;
  tags: readonly PublicCacheTag[];
};

export const PUBLIC_CACHE_TAGS = {
  all: "gbe-public-v1",
  nominations: "gbe-nominations-v1",
  winners: "gbe-winners-v1",
} as const;

export type PublicCacheScope = keyof typeof PUBLIC_CACHE_TAGS;
export type PublicCacheTag = (typeof PUBLIC_CACHE_TAGS)[PublicCacheScope];

export const ONE_YEAR_IN_SECONDS = 31_536_000;

const DEFAULT_PUBLIC_CACHE: PublicCacheOptions = {
  browserMaxAge: 86_400,
  downstreamMaxAge: ONE_YEAR_IN_SECONDS,
  vercelMaxAge: ONE_YEAR_IN_SECONDS,
  staleWhileRevalidate: 86_400,
  tags: [PUBLIC_CACHE_TAGS.all],
};

/**
 * Keeps public HTML durable at Vercel and downstream CDN edges. Browser copies
 * are intentionally bounded because they cannot be purged remotely. Provider
 * caches are cleared manually when public content changes.
 */
export function setPublicResponseCache(
  headers: Headers,
  options: Partial<PublicCacheOptions> = {},
) {
  const cache = { ...DEFAULT_PUBLIC_CACHE, ...options };
  const vercelCacheValue = `public, s-maxage=${cache.vercelMaxAge}, stale-while-revalidate=${cache.staleWhileRevalidate}`;
  const downstreamCacheValue = `public, s-maxage=${cache.downstreamMaxAge}, stale-while-revalidate=${cache.staleWhileRevalidate}`;
  const browserCacheValue = `public, max-age=${cache.browserMaxAge}, must-revalidate`;

  headers.set("Cache-Control", browserCacheValue);
  headers.set("CDN-Cache-Control", downstreamCacheValue);
  headers.set("Vercel-CDN-Cache-Control", vercelCacheValue);
  headers.set("Vercel-Cache-Tag", [...new Set(cache.tags)].join(","));
}

export function publicCacheTags(scope: Exclude<PublicCacheScope, "all">) {
  return [PUBLIC_CACHE_TAGS.all, PUBLIC_CACHE_TAGS[scope]] as const;
}

export function publicCachedResponse(
  body: BodyInit | null,
  init: ResponseInit & { cacheTags: readonly PublicCacheTag[] },
) {
  const headers = new Headers(init.headers);
  setPublicResponseCache(headers, { tags: init.cacheTags });
  return new Response(body, { ...init, headers });
}

export function publicCachedRedirect(
  location: string,
  cacheTags: readonly PublicCacheTag[],
  status: 301 | 302 | 307 | 308 = 301,
) {
  return publicCachedResponse(null, {
    status,
    headers: { location },
    cacheTags,
  });
}
