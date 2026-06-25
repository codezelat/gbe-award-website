export const SITE_URL = "https://gbeaward.com";
export const SITE_NAME = "Global Business Excellence Awards";
export const SITE_SHORT_NAME = "GBE Awards";
export const SITE_DEFAULT_LOCALE = "en_GB";
export const SITE_TWITTER_HANDLE = "@gbeaward";
export const SITE_ORGANIZER_NAME = "London Business Consultancy";
export const SITE_ORGANIZER_EMAIL = "info@gbeaward.com";
export const SITE_WHATSAPP_URL = "https://wa.link/10p065";
export const SITE_DEFAULT_OG_IMAGE = "/assets/brand/hero-award-2026.png";

export const SITE_SOCIAL_LINKS = [
  "https://www.instagram.com/gbeaward/",
  "https://www.facebook.com/gbeaward/",
  "https://www.x.com/gbeaward/",
  "https://www.linkedin.com/company/gbeaward/",
  SITE_WHATSAPP_URL,
];

export const PUBLIC_SITE_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/nominees", changefreq: "weekly", priority: "0.8" },
  { path: "/previous-winners", changefreq: "weekly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
] as const;
