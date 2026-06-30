export type AboutGalleryImage = {
  src: string;
  srcSet: string;
  alt: string;
  position?: string;
  portrait?: boolean;
};

const imageNumbers = [2, 3, 4, 5, 6, 9, 15, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26, 28, 30, 32, 33, 34, 35];

const portraitImages = new Set([6, 22, 23, 35]);

const positions: Record<number, string> = {
  6: "50% 24%",
  20: "50% 42%",
  22: "50% 22%",
  23: "50% 20%",
  35: "50% 26%",
};

const largeWidths: Record<number, number> = {
  6: 1365,
  17: 1178,
  18: 1178,
  20: 1179,
  22: 1366,
  23: 1170,
  32: 1179,
  33: 1179,
  34: 1179,
  35: 800,
};

const displayWidths: Record<number, number> = {
  35: 800,
};

export const aboutGalleryImages: AboutGalleryImage[] = imageNumbers.map((number) => {
  const name = String(number).padStart(2, "0");
  const displayWidth = displayWidths[number] ?? 900;
  const largeWidth = largeWidths[number] ?? 1440;

  return {
    src: `/assets/about-gallery/about-gallery-${name}.webp`,
    srcSet: `/assets/about-gallery/about-gallery-${name}.webp ${displayWidth}w, /assets/about-gallery/about-gallery-${name}-large.webp ${largeWidth}w`,
    alt: `Global Business Excellence Awards ceremony photograph ${name}`,
    position: positions[number] ?? "50% 44%",
    portrait: portraitImages.has(number),
  };
});
