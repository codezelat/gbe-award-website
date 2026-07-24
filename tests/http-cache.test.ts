import { describe, expect, it } from "vitest";
import {
  ONE_YEAR_IN_SECONDS,
  PUBLIC_CACHE_TAGS,
  publicCachedRedirect,
  publicCacheTags,
  setPublicResponseCache,
} from "../src/lib/http-cache";

describe("setPublicResponseCache", () => {
  it("uses a bounded browser lifetime and durable shared-CDN caching", () => {
    const headers = new Headers();

    setPublicResponseCache(headers);

    expect(headers.get("Cache-Control")).toBe(
      "public, max-age=86400, must-revalidate",
    );
    expect(headers.get("CDN-Cache-Control")).toBe(
      `public, s-maxage=${ONE_YEAR_IN_SECONDS}, stale-while-revalidate=86400`,
    );
    expect(headers.get("Vercel-CDN-Cache-Control")).toBe(
      `public, s-maxage=${ONE_YEAR_IN_SECONDS}, stale-while-revalidate=86400`,
    );
    expect(headers.get("Vercel-Cache-Tag")).toBe(PUBLIC_CACHE_TAGS.all);
  });

  it("supports independent cache lifetimes and deduplicated tags", () => {
    const headers = new Headers();

    setPublicResponseCache(headers, {
      browserMaxAge: 300,
      downstreamMaxAge: 3600,
      vercelMaxAge: 7200,
      staleWhileRevalidate: 86400,
      tags: [
        PUBLIC_CACHE_TAGS.all,
        PUBLIC_CACHE_TAGS.winners,
        PUBLIC_CACHE_TAGS.winners,
      ],
    });

    expect(headers.get("Cache-Control")).toBe("public, max-age=300, must-revalidate");
    expect(headers.get("CDN-Cache-Control")).toBe(
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    expect(headers.get("Vercel-CDN-Cache-Control")).toBe(
      "public, s-maxage=7200, stale-while-revalidate=86400",
    );
    expect(headers.get("Vercel-Cache-Tag")).toBe(
      `${PUBLIC_CACHE_TAGS.all},${PUBLIC_CACHE_TAGS.winners}`,
    );
  });

  it("tags scoped content with the global and scoped tags", () => {
    expect(publicCacheTags("nominations")).toEqual([
      PUBLIC_CACHE_TAGS.all,
      PUBLIC_CACHE_TAGS.nominations,
    ]);
  });

  it("applies the public cache policy to redirects", () => {
    const response = publicCachedRedirect(
      "/previous-winners/example",
      publicCacheTags("winners"),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "/previous-winners/example",
    );
    expect(response.headers.get("Vercel-Cache-Tag")).toContain(
      PUBLIC_CACHE_TAGS.winners,
    );
  });
});
