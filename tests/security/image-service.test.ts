import { createRequire } from "node:module";
import { beforeAll, describe, expect, it, vi } from "vitest";
import sharpService from "astro/assets/services/sharp";

// Resolve from Astro, just as its default image service does. A separate direct
// Sharp dependency must not hide an older decoder in Astro's own dependency tree.
const require = createRequire(import.meta.url);
const astroPackage = require.resolve("astro/package.json");
const astroRequire = createRequire(astroPackage);
const sharp = astroRequire("sharp") as typeof import("sharp");
const astroVersion = require(astroPackage).version as string;
const config = {
  service: { entrypoint: "astro/assets/services/sharp", config: {} },
} as Parameters<typeof sharpService.transform>[2];
const logger = { warn: vi.fn() } as unknown as Parameters<typeof sharpService.transform>[3];

function atLeast(actual: string, required: string) {
  const a = actual.split(".").map(Number);
  const b = required.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return a[index] > b[index];
  }
  return true;
}

let avif: Buffer;
beforeAll(async () => {
  avif = await sharp({ create: { width: 32, height: 24, channels: 4, background: { r: 25, g: 75, b: 110, alpha: 0.6 } } }).avif().toBuffer();
});

describe("Astro AVIF security dependency boundary (GHSA-26w7-cxv4-gfx2)", () => {
  it("uses the patched Astro, Sharp and native libheif chain", () => {
    expect(atLeast(astroVersion, "7.2.8")).toBe(true);
    expect(atLeast(sharp.versions.sharp, "0.35.4")).toBe(true);
    expect(atLeast(sharp.versions.heif, "1.23.2")).toBe(true);
  });

  it.each(["/control.avif", "/avif-content-with-a-png-name.png"])("decodes AVIF bytes through the real Astro service: %s", async (src) => {
    const result = await sharpService.transform(new Uint8Array(avif), { src, width: 8, format: "webp" }, config, logger);
    const metadata = await sharp(result.data).metadata();
    expect(result.format).toBe("webp");
    expect(metadata).toMatchObject({ format: "webp", width: 8, height: 6 });
  });

  it.each(["png", "jpeg"] as const)("preserves ordinary %s optimization", async (format) => {
    const control = await sharp({ create: { width: 32, height: 24, channels: 3, background: "#204060" } }).toFormat(format).toBuffer();
    const result = await sharpService.transform(new Uint8Array(control), { src: `/control.${format}`, width: 8, format: "webp" }, config, logger);
    expect(await sharp(result.data).metadata()).toMatchObject({ format: "webp", width: 8, height: 6 });
  });

  it("rejects truncated AVIF in the patched decoder and remains usable", async () => {
    await expect(sharp(avif.subarray(0, 20)).toBuffer()).rejects.toThrow();
    expect(await sharp(avif).metadata()).toMatchObject({ width: 32, height: 24 });
  });

  it("rejects non-image bytes at the Astro transform boundary", async () => {
    await expect(sharpService.transform(new Uint8Array(Buffer.from("invalid AVIF data")), { src: "/invalid.avif", width: 8, format: "webp" }, config, logger)).rejects.toThrow();
  });
});
