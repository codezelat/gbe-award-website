import { describe, expect, it } from "vitest";
import { setPublicResponseCache } from "../src/lib/http-cache";

describe("setPublicResponseCache", () => {
  it("uses a short browser lifetime and targeted shared-CDN caching", () => {
    const headers = new Headers();

    setPublicResponseCache(headers);

    expect(headers.get("Cache-Control")).toBe("public, max-age=60, must-revalidate");
    expect(headers.get("CDN-Cache-Control")).toBe("public, s-maxage=300, stale-while-revalidate=3600");
    expect(headers.get("Vercel-CDN-Cache-Control")).toBe("public, s-maxage=300, stale-while-revalidate=3600");
  });

  it("allows long-lived, stale-while-revalidate content", () => {
    const headers = new Headers();

    setPublicResponseCache(headers, {
      browserMaxAge: 300,
      cdnMaxAge: 3600,
      staleWhileRevalidate: 86400,
    });

    expect(headers.get("Cache-Control")).toBe("public, max-age=300, must-revalidate");
    expect(headers.get("Vercel-CDN-Cache-Control")).toBe("public, s-maxage=3600, stale-while-revalidate=86400");
  });
});
