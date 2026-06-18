import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const targetUrl = "https://gbeaward.com/";
const root = process.cwd();
const researchDir = path.join(root, "docs", "research");
const referencesDir = path.join(root, "docs", "design-references");
const assetDir = path.join(root, "public", "assets", "live");

const interestingStyleProps = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "color",
  "backgroundColor",
  "backgroundImage",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "marginTop",
  "marginBottom",
  "borderRadius",
  "boxShadow",
  "display",
  "gridTemplateColumns",
  "gap",
  "position",
  "zIndex",
  "opacity",
  "transform",
  "transition",
];

function sanitizeFileName(inputUrl, fallback = "asset") {
  const url = new URL(inputUrl);
  const ext = path.extname(url.pathname).split("?")[0] || ".bin";
  const base = path.basename(url.pathname, ext) || fallback;
  const hash = createHash("sha256").update(inputUrl).digest("hex").slice(0, 10);
  return `${base.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-${hash}${ext}`;
}

async function downloadAsset(inputUrl) {
  if (!inputUrl || inputUrl.startsWith("data:") || inputUrl.startsWith("blob:")) {
    return null;
  }

  const url = new URL(inputUrl, targetUrl).href;
  const fileName = sanitizeFileName(url);
  const localPath = path.join(assetDir, fileName);
  const publicPath = `/assets/live/${fileName}`;

  try {
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
    await writeFile(localPath, buffer);
    return { url, publicPath, status: response.status, bytes: buffer.length };
  } catch (error) {
    return { url, publicPath: null, error: error.message };
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function main() {
  await mkdir(researchDir, { recursive: true });
  await mkdir(path.join(researchDir, "components"), { recursive: true });
  await mkdir(referencesDir, { recursive: true });
  await mkdir(assetDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
  await desktop.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
  await desktop.waitForLoadState("load", { timeout: 30000 }).catch(() => {});
  await desktop.waitForTimeout(2500);
  await desktop.screenshot({
    path: path.join(referencesDir, "gbeaward-home-desktop-1440.png"),
    fullPage: true,
  });

  const topStyles = await desktop.evaluate(() => {
    const header = document.querySelector("header, nav, .navbar, .site-header");
    if (!header) return null;
    const before = getComputedStyle(header);
    return {
      scrollY: window.scrollY,
      backgroundColor: before.backgroundColor,
      boxShadow: before.boxShadow,
      position: before.position,
      transform: before.transform,
      height: before.height,
    };
  });

  await desktop.evaluate(() => window.scrollTo(0, 240));
  await desktop.waitForTimeout(600);
  const scrolledStyles = await desktop.evaluate(() => {
    const header = document.querySelector("header, nav, .navbar, .site-header");
    if (!header) return null;
    const after = getComputedStyle(header);
    return {
      scrollY: window.scrollY,
      backgroundColor: after.backgroundColor,
      boxShadow: after.boxShadow,
      position: after.position,
      transform: after.transform,
      height: after.height,
    };
  });

  await desktop.evaluate(() => window.scrollTo(0, 0));
  await desktop.waitForTimeout(300);

  const extracted = await desktop.evaluate((interestingStyleProps) => {
    const readStyle = (element) => {
      const computed = getComputedStyle(element);
      return Object.fromEntries(
        interestingStyleProps
          .map((prop) => [prop, computed[prop]])
          .filter(([, value]) => value && value !== "none" && value !== "normal" && value !== "0px")
      );
    };

    const getBackgroundUrl = (element) => {
      const bg = getComputedStyle(element).backgroundImage;
      const match = bg?.match(/url\(["']?(.*?)["']?\)/);
      return match?.[1] || null;
    };

    const semanticBlocks = [...document.querySelectorAll("header, main > *, section, footer")].map(
      (element, index) => {
        const rect = element.getBoundingClientRect();
        const headings = [...element.querySelectorAll("h1,h2,h3")].map((node) => node.textContent.trim()).filter(Boolean);
        const buttons = [...element.querySelectorAll("a,button")].map((node) => node.textContent.trim()).filter(Boolean).slice(0, 12);
        const images = [...element.querySelectorAll("img")].map((img) => ({
          src: img.currentSrc || img.src,
          alt: img.alt,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        }));
        return {
          index,
          tag: element.tagName.toLowerCase(),
          id: element.id,
          classes: typeof element.className === "string" ? element.className : "",
          rect: { top: Math.round(rect.top + scrollY), width: Math.round(rect.width), height: Math.round(rect.height) },
          headings,
          buttons,
          text: element.textContent.replace(/\s+/g, " ").trim().slice(0, 1800),
          styles: readStyle(element),
          backgroundUrl: getBackgroundUrl(element),
          images,
        };
      }
    );

    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || "",
      canonical: document.querySelector('link[rel="canonical"]')?.href || "",
      htmlClasses: document.documentElement.className,
      bodyClasses: document.body.className,
      fonts: [...new Set([...document.querySelectorAll("h1,h2,h3,p,a,button,span")].slice(0, 250).map((el) => getComputedStyle(el).fontFamily))],
      colors: [...new Set([...document.querySelectorAll("h1,h2,h3,p,a,button,span,section,div")].slice(0, 500).flatMap((el) => {
        const styles = getComputedStyle(el);
        return [styles.color, styles.backgroundColor, styles.borderColor].filter(Boolean);
      }))],
      links: [...document.querySelectorAll("a[href]")].map((a) => ({ href: a.href, text: a.textContent.trim() })).filter((a) => a.text || a.href),
      images: [...document.querySelectorAll("img")].map((img) => ({
        src: img.currentSrc || img.src,
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        loading: img.loading,
      })),
      backgroundImages: [...document.querySelectorAll("*")]
        .map((el) => ({ url: getBackgroundUrl(el), tag: el.tagName.toLowerCase(), classes: typeof el.className === "string" ? el.className : "" }))
        .filter((entry) => entry.url),
      favicons: [...document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]')].map((link) => ({
        href: link.href,
        rel: link.rel,
        sizes: link.sizes?.toString() || "",
      })),
      scripts: [...document.scripts].map((script) => script.src).filter(Boolean),
      semanticBlocks,
    };
  }, interestingStyleProps);

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 900 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  await mobile.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
  await mobile.waitForLoadState("load", { timeout: 30000 }).catch(() => {});
  await mobile.waitForTimeout(2500);
  await mobile.screenshot({
    path: path.join(referencesDir, "gbeaward-home-mobile-390.png"),
    fullPage: true,
  });
  const mobileBlocks = await mobile.evaluate(() =>
    [...document.querySelectorAll("header, main > *, section, footer")].map((element, index) => {
      const rect = element.getBoundingClientRect();
      return {
        index,
        tag: element.tagName.toLowerCase(),
        classes: typeof element.className === "string" ? element.className : "",
        rect: { top: Math.round(rect.top + scrollY), width: Math.round(rect.width), height: Math.round(rect.height) },
        headings: [...element.querySelectorAll("h1,h2,h3")].map((node) => node.textContent.trim()).filter(Boolean),
      };
    })
  );

  await browser.close();

  const assetUrls = unique([
    ...extracted.images.map((image) => image.src),
    ...extracted.backgroundImages.map((image) => image.url),
    ...extracted.favicons.map((icon) => icon.href),
  ]);

  const downloadedAssets = [];
  for (const url of assetUrls) {
    downloadedAssets.push(await downloadAsset(url));
  }

  const assetMap = Object.fromEntries(
    downloadedAssets.filter((asset) => asset?.publicPath).map((asset) => [asset.url, asset.publicPath])
  );

  const payload = {
    targetUrl,
    capturedAt: new Date().toISOString(),
    screenshots: {
      desktop: "docs/design-references/gbeaward-home-desktop-1440.png",
      mobile: "docs/design-references/gbeaward-home-mobile-390.png",
    },
    headerBehavior: { topStyles, scrolledStyles },
    extracted,
    mobileBlocks,
    downloadedAssets,
    assetMap,
  };

  await writeFile(path.join(researchDir, "live-homepage-extract.json"), JSON.stringify(payload, null, 2));

  const topology = [
    "# GBE Awards Homepage Topology",
    "",
    `Captured from ${targetUrl} on ${payload.capturedAt}.`,
    "",
    "## Screenshots",
    "- Desktop: `docs/design-references/gbeaward-home-desktop-1440.png`",
    "- Mobile: `docs/design-references/gbeaward-home-mobile-390.png`",
    "",
    "## Sections",
    ...extracted.semanticBlocks.map((block) => [
      "",
      `### ${block.index + 1}. ${block.tag}${block.id ? `#${block.id}` : ""}`,
      `- Classes: \`${block.classes || "none"}\``,
      `- Desktop rect: top ${block.rect.top}px, width ${block.rect.width}px, height ${block.rect.height}px`,
      `- Headings: ${block.headings.length ? block.headings.map((heading) => `"${heading}"`).join(", ") : "N/A"}`,
      `- Buttons/links: ${block.buttons.length ? block.buttons.map((button) => `"${button}"`).join(", ") : "N/A"}`,
      `- Interaction model: ${block.buttons.length ? "link/hover-driven" : "static/scroll-reveal candidate"}`,
      `- Text sample: ${block.text.slice(0, 500) || "N/A"}`,
    ].join("\n")),
  ].join("\n");

  const behaviors = [
    "# GBE Awards Homepage Behaviors",
    "",
    `Captured from ${targetUrl} on ${payload.capturedAt}.`,
    "",
    "## Header Scroll State",
    "```json",
    JSON.stringify(payload.headerBehavior, null, 2),
    "```",
    "",
    "## Global Signals",
    `- HTML classes: \`${extracted.htmlClasses || "none"}\``,
    `- Body classes: \`${extracted.bodyClasses || "none"}\``,
    `- Fonts observed: ${extracted.fonts.join(" | ") || "N/A"}`,
    `- Scripts observed: ${extracted.scripts.slice(0, 20).join(" | ") || "N/A"}`,
    "",
    "## Responsive Blocks",
    "```json",
    JSON.stringify(mobileBlocks, null, 2),
    "```",
  ].join("\n");

  await writeFile(path.join(researchDir, "PAGE_TOPOLOGY.md"), topology);
  await writeFile(path.join(researchDir, "BEHAVIORS.md"), behaviors);

  console.log(`Captured ${extracted.semanticBlocks.length} blocks.`);
  console.log(`Discovered ${assetUrls.length} assets, downloaded ${downloadedAssets.filter((asset) => asset?.publicPath).length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
