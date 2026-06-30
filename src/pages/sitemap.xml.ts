import type { APIRoute } from "astro";
import { PUBLIC_SITE_PAGES, SITE_URL } from "../lib/site";
import { getIndexableWinnerUrls } from "../lib/winners/queries";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async () => {
  const winnerUrls = await getIndexableWinnerUrls();
  const staticUrls = PUBLIC_SITE_PAGES.map(
    (page) => `  <url>
    <loc>${escapeXml(new URL(page.path, SITE_URL).toString())}</loc>
  </url>`,
  );
  const winnerEntries = winnerUrls.map((winner) => {
    const loc = new URL(`/previous-winners/${winner.slug}`, SITE_URL).toString();
    const image = winner.imageUrl
      ? `\n    <image:image>\n      <image:loc>${escapeXml(new URL(winner.imageUrl, SITE_URL).toString())}</image:loc>\n    </image:image>`
      : "";

    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${winner.lastmod.toISOString()}</lastmod>${image}
  </url>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...staticUrls, ...winnerEntries].join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
