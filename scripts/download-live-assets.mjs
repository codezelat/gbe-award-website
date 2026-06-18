import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const pageUrl = "https://gbeaward.com/";
const assetDir = path.join(root, "public", "assets", "live");
const manifestPath = path.join(root, "docs", "research", "asset-map.json");

function sanitizeFileName(inputUrl) {
  const url = new URL(inputUrl);
  const ext = path.extname(url.pathname) || ".bin";
  const base = path.basename(url.pathname, ext) || "asset";
  const hash = createHash("sha256").update(inputUrl).digest("hex").slice(0, 10);
  return `${base.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-${hash}${ext}`;
}

async function getHtml() {
  try {
    return await readFile("/tmp/gbeaward-home.html", "utf8");
  } catch {
    const response = await fetch(pageUrl);
    if (!response.ok) throw new Error(`Failed to fetch ${pageUrl}: ${response.status}`);
    return response.text();
  }
}

async function download(url) {
  const fileName = sanitizeFileName(url);
  const filePath = path.join(assetDir, fileName);
  const publicPath = `/assets/live/${fileName}`;
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    },
  });

  if (!response.ok) {
    return { url, publicPath: null, status: response.status };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
  return { url, publicPath, status: response.status, bytes: buffer.length };
}

const html = await getHtml();
await mkdir(assetDir, { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });

const allUrls = [...html.matchAll(/https:\/\/gbeaward\.com\/wp-content\/uploads\/[^"' <>)]+/g)]
  .map((match) => match[0].replace(/&amp;/g, "&"))
  .filter((url) => /\.(png|jpe?g|webp|gif|svg|mp4)(\?|$)/i.test(url));

const uniqueUrls = [...new Set(allUrls)];
const downloads = [];
for (const url of uniqueUrls) {
  downloads.push(await download(url));
}

const manifest = {
  pageUrl,
  generatedAt: new Date().toISOString(),
  total: uniqueUrls.length,
  downloaded: downloads.filter((item) => item.publicPath).length,
  assets: Object.fromEntries(downloads.filter((item) => item.publicPath).map((item) => [item.url, item.publicPath])),
  failures: downloads.filter((item) => !item.publicPath),
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Downloaded ${manifest.downloaded}/${manifest.total} assets.`);
if (manifest.failures.length) {
  console.log(`Failures: ${manifest.failures.length}`);
}
