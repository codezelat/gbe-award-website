export const SITE_URL = "https://gbeaward.com";
export const SITE_NAME = "Global Business Excellence Awards";
export const SITE_SHORT_NAME = "GBE Awards";
export const SITE_DEFAULT_LOCALE = "en_GB";
export const SITE_TWITTER_HANDLE = "@gbeaward";
export const SITE_GA4_PROPERTY_ID = "475879239";
export const SITE_GOOGLE_TAG_ID = import.meta.env.PUBLIC_GOOGLE_TAG_ID || "GT-W6V9ZG59";
export const SITE_ORGANIZER_NAME = "London Business Consultancy";
export const SITE_ORGANIZER_EMAIL = "info@gbeaward.com";
export const SITE_WHATSAPP_URL = "https://wa.link/10p065";
export const SITE_DEFAULT_OG_IMAGE = "/assets/brand/hero-award-2026.webp";
export const SITE_LAST_UPDATED = "2026-06-30";

export const SITE_SOCIAL_LINKS = [
  "https://www.facebook.com/gbeaward/",
  "https://www.instagram.com/gbeaward/",
  "https://www.x.com/gbeaward/",
  "https://www.linkedin.com/company/gbeaward/",
  SITE_WHATSAPP_URL,
];

export const PUBLIC_SITE_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0", lastmod: SITE_LAST_UPDATED },
  { path: "/about", changefreq: "monthly", priority: "0.8", lastmod: SITE_LAST_UPDATED },
  { path: "/nominees", changefreq: "weekly", priority: "0.8", lastmod: SITE_LAST_UPDATED },
  { path: "/previous-winners", changefreq: "weekly", priority: "0.8", lastmod: SITE_LAST_UPDATED },
  { path: "/contact", changefreq: "monthly", priority: "0.7", lastmod: SITE_LAST_UPDATED },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3", lastmod: SITE_LAST_UPDATED },
] as const;

export const PUBLIC_SITE_PAGE_IMAGES: Record<string, Array<{ loc: string; title: string; caption?: string }>> = {
  "/": [
    {
      loc: SITE_DEFAULT_OG_IMAGE,
      title: "Global Business Excellence Awards 2026 trophy",
      caption: "GBE Awards 2026 public website hero image.",
    },
    {
      loc: "/assets/gallery/leadership-award.webp",
      title: "GBE Awards leadership award presentation",
      caption: "Past Global Business Excellence Awards ceremony moment.",
    },
    {
      loc: "/assets/magazine/gbe-awards-magazine-2025-mockup-large.webp",
      title: "GBE Awards 2025 magazine cover and final page",
      caption: "Magazine feature linking to the GBE Awards 2025 edition.",
    },
  ],
  "/about": [
    {
      loc: "/assets/gallery/award-presentation.webp",
      title: "GBE Awards stage award presentation",
      caption: "Global Business Excellence Awards ceremony presentation photograph.",
    },
    {
      loc: "/assets/journey/about-stage-winners.webp",
      title: "GBE Awards winners and presenters on stage",
      caption: "Award recipients and presenters at the Global Business Excellence Awards.",
    },
  ],
  "/nominees": [
    {
      loc: SITE_DEFAULT_OG_IMAGE,
      title: "GBE Awards nominee recognition",
      caption: "Global Business Excellence Awards nominees page hero image.",
    },
  ],
  "/previous-winners": [
    {
      loc: SITE_DEFAULT_OG_IMAGE,
      title: "GBE Awards previous winners",
      caption: "Global Business Excellence Awards previous winners page hero image.",
    },
  ],
  "/contact": [
    {
      loc: "/assets/journey/about-event-welcome.webp",
      title: "GBE Awards ceremony welcome",
      caption: "Contact page ceremony image for the Global Business Excellence Awards.",
    },
  ],
};
