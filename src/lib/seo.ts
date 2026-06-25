import {
  SITE_DEFAULT_LOCALE,
  SITE_DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_ORGANIZER_EMAIL,
  SITE_ORGANIZER_NAME,
  SITE_SHORT_NAME,
  SITE_SOCIAL_LINKS,
  SITE_TWITTER_HANDLE,
  SITE_URL,
} from "./site";

export type JsonLd = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type SeoConfig = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string;
  noindex?: boolean;
  schema?: JsonLd | JsonLd[];
};

type AwardSeoInput = {
  kind: "winner" | "nomination";
  title: string;
  name: string;
  category: string;
  year: number;
  market?: string | null;
  summary?: string | null;
  slug: string;
  imageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function assetUrl(path = SITE_DEFAULT_OG_IMAGE) {
  return absoluteUrl(path);
}

export function normalizeDescription(value: string, max = 160) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const shortened = clean.slice(0, max - 1);
  const safeCut = shortened.lastIndexOf(" ");
  return `${(safeCut > 80 ? shortened.slice(0, safeCut) : shortened).trim()}…`;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildOrganizationSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: SITE_URL,
    email: SITE_ORGANIZER_EMAIL,
    sameAs: SITE_SOCIAL_LINKS,
    logo: {
      "@type": "ImageObject",
      url: assetUrl("/assets/brand/gbe-logo-full.png"),
    },
    image: assetUrl("/assets/brand/hero-award-2026.png"),
    description:
      "Global Business Excellence Awards recognises outstanding companies, entrepreneurs, and leaders across the United Kingdom, Sri Lanka, and international markets.",
    areaServed: ["United Kingdom", "Sri Lanka", "International"],
    parentOrganization: {
      "@type": "Organization",
      name: SITE_ORGANIZER_NAME,
      address: {
        "@type": "PostalAddress",
        addressLocality: "London",
        addressCountry: "GB",
      },
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SITE_ORGANIZER_EMAIL,
        availableLanguage: ["English"],
      },
    ],
  };
}

export function buildWebsiteSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en-GB",
  };
}

export function buildPageSchema({
  path,
  title,
  description,
  pageType = "WebPage",
  image,
}: {
  path: string;
  title: string;
  description: string;
  pageType?: "WebPage" | "CollectionPage" | "AboutPage" | "ContactPage";
  image?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": pageType,
    "@id": `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: title,
    description,
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    about: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en-GB",
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: assetUrl(image),
    },
  };
}

export function buildItemListSchema({
  path,
  title,
  items,
}: {
  path: string;
  title: string;
  items: Array<{ name: string; image?: string; description?: string }>;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${absoluteUrl(path)}#itemlist`,
    name: title,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: item.name,
        image: item.image ? assetUrl(item.image) : undefined,
        description: item.description,
      },
    })),
  };
}

export function buildEventSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${SITE_URL}/#event`,
    name: "Global Business Excellence Awards 2026",
    description:
      "The Global Business Excellence Awards 2026 celebrates outstanding business leadership, innovation, and impact across the UK, Sri Lanka, and international markets.",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    image: [assetUrl("/assets/brand/hero-award-2026.png")],
    url: SITE_URL,
    organizer: {
      "@id": `${SITE_URL}/#organization`,
    },
    location: [
      {
        "@type": "Place",
        name: "London, United Kingdom",
        address: {
          "@type": "PostalAddress",
          addressLocality: "London",
          addressCountry: "GB",
        },
      },
      {
        "@type": "Place",
        name: "Colombo, Sri Lanka",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Colombo",
          addressCountry: "LK",
        },
      },
    ],
  };
}

export function buildAwardEntrySeo(input: AwardSeoInput) {
  const label = input.kind === "winner" ? "Winner" : "Nominee";
  const pathBase = input.kind === "winner" ? "/previous-winners" : "/nominees";
  const path = `${pathBase}/${input.slug}`;
  const title =
    input.seoTitle?.trim() ||
    `${input.name} | ${input.category} ${label} | Global Business Excellence Awards ${input.year}`;
  const description = normalizeDescription(
    input.seoDescription?.trim() ||
      input.summary?.trim() ||
      `${input.name} is featured in ${input.category} for the Global Business Excellence Awards ${input.year}${input.market ? ` in ${input.market}` : ""}.`,
  );

  return {
    title,
    description,
    path,
    image: input.imageUrl || SITE_DEFAULT_OG_IMAGE,
    schema: [
      buildPageSchema({
        path,
        title,
        description,
        image: input.imageUrl || SITE_DEFAULT_OG_IMAGE,
      }),
      buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: input.kind === "winner" ? "Previous Winners" : "Nominees", path: pathBase },
        { name: input.name, path },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Thing",
        "@id": `${absoluteUrl(path)}#entry`,
        name: input.name,
        description,
        image: assetUrl(input.imageUrl || SITE_DEFAULT_OG_IMAGE),
        additionalType: `https://schema.org/${input.kind === "winner" ? "Award" : "ListItem"}`,
        url: absoluteUrl(path),
      },
    ] satisfies JsonLd[],
  };
}

export const seoDefaults = {
  siteName: SITE_NAME,
  locale: SITE_DEFAULT_LOCALE,
  twitterHandle: SITE_TWITTER_HANDLE,
  defaultImage: SITE_DEFAULT_OG_IMAGE,
};
