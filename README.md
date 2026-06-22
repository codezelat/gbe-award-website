# Global Business Excellence Awards (GBE Awards)

The official website for the **Global Business Excellence Awards 2026**, organised by London Business Consultancy in London, UK. The awards celebrate outstanding companies, entrepreneurs, and visionaries across the United Kingdom, Sri Lanka, and the world.

Built with Astro, React, and Tailwind CSS for a fast, accessible, and SEO-optimised experience.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Pages](#pages)
- [Components](#components)
- [Styling](#styling)
- [Assets](#assets)
- [SEO](#seo)
- [Build and Deploy](#build-and-deploy)
- [Scripts](#scripts)
- [License](#license)

---

## Overview

GBE Awards is a prestigious international business awards platform bridging London's corporate community with Colombo's thriving enterprise ecosystem. The website showcases award categories, featured nominees, previous winners, and provides a nomination/application pathway for businesses worldwide.

### Key Features

- **7 fully designed pages** with consistent design language
- **Responsive design** with breakpoints at 1024px and 560px
- **Swiper carousels** for category and nominee showcases
- **Scroll-aware header** with frosted glass effect on scroll
- **Accessibility** baked in: semantic HTML, ARIA labels, focus-visible outlines, reduced-motion support
- **SEO complete**: per-page meta tags, Open Graph, Twitter Cards, JSON-LD structured data, sitemap, robots.txt
- **PWA-ready** with web manifest and theme colour
- **Optimised assets**: all images served as WebP where possible, semantic file naming, organised directory structure

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Astro](https://astro.build) | ^6.4.8 | Static site generator, page routing |
| [React](https://react.dev) | ^19.2 | Interactive components (sliders, social links, animations) |
| [Tailwind CSS](https://tailwindcss.com) | ^4.3 | Utility-first styling, custom theme tokens |
| [Swiper](https://swiperjs.com) | ^12.2 | Touch-enabled carousels |
| [@fontsource/tajawal](https://fontsource.org) | ^5.2 | Primary UI/body font (self-hosted) |
| [@fontsource/tangerine](https://fontsource.org) | ^5.2 | Script font for decorative headings |
| [Motion](https://motion.dev) | ^12.40 | Animation library (available, used selectively) |
| [Lucide React](https://lucide.dev) | ^1.21 | Icon library (available, custom SVGs used where needed) |
| [clsx](https://github.com/lukeed/clsx) | ^2.1 | Conditional class names |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | ^3.6 | Tailwind class conflict resolution |
| [Playwright](https://playwright.dev) | ^1.61 | E2E testing and asset capture (dev dependency) |

---

## Prerequisites

- **Node.js** >= 22.12.0
- **npm** (bundled with Node.js)

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/sayuru/gbe-award-website.git
cd gbe-award-website

# Install dependencies
npm install

# Start the development server
npm run dev
```

The dev server runs at `http://localhost:4321`.

---

## Project Structure

```
gbe-award-website/
├── public/
│   ├── assets/
│   │   ├── brand/           # Logo, trophy, award icon, favicons
│   │   ├── journey/         # Hero/journey section photos
│   │   └── nominees/        # Nominee portraits and logos
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── robots.txt           # Search engine crawling rules
│   ├── sitemap.xml          # URL index for search engines
│   └── site.webmanifest     # PWA manifest
├── src/
│   ├── components/
│   │   ├── AboutSection.astro
│   │   ├── CategoriesSection.astro
│   │   ├── Header.astro
│   │   ├── HeroLiveBackground.tsx
│   │   ├── HeroSection.astro
│   │   ├── JourneyImageSlider.tsx
│   │   ├── JourneySection.astro
│   │   ├── LoopSliders.tsx
│   │   ├── NomineesSection.astro
│   │   ├── SiteFooter.astro
│   │   └── SocialLinks.tsx
│   ├── data/
│   │   └── home.ts          # Central data: asset paths, nav, categories, nominees, SEO
│   ├── pages/
│   │   ├── index.astro      # Homepage
│   │   ├── about.astro      # About GBE Awards
│   │   ├── contact.astro    # Contact form and details
│   │   ├── nominees.astro   # All nominees grid
│   │   ├── previous-winners.astro
│   │   ├── privacy-policy.astro
│   │   └── 404.astro        # Custom not-found page
│   └── styles/
│       └── global.css       # Tailwind config, theme tokens, component styles, animations
├── docs/                    # Design references and research docs
├── scripts/                 # Asset capture/download tooling
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── AGENTS.md                # AI coding agent instructions
└── README.md                # This file
```

---

## Pages

| Route | File | Description |
|---|---|---|
| `/` | `index.astro` | Homepage with hero, about teaser, categories, journey, nominees |
| `/about` | `about.astro` | Full about page with mission, values, judging process, stats |
| `/contact` | `contact.astro` | Contact form, organisation details, social links |
| `/nominees` | `nominees.astro` | Grid of all nominees with card design |
| `/previous-winners` | `previous-winners.astro` | Hall of Excellence with premium animated winner cards |
| `/privacy-policy` | `privacy-policy.astro` | Full privacy policy |
| 404 | `404.astro` | Custom 404 with gold styling and return-home CTA |

---

## Components

### Astro Components (`.astro`)

Rendered at build time (zero client JS unless they hydrate React islands).

- **Header.astro** - Fixed navigation with scroll-aware shrink effect, desktop pill nav, mobile hamburger
- **HeroSection.astro** - Full-height hero with animated background, trophy assets, CTA
- **AboutSection.astro** - Homepage about teaser card with mandala decorations
- **CategoriesSection.astro** - Heading + Swiper category carousel
- **JourneySection.astro** - Media gallery + copy + CTA
- **NomineesSection.astro** - Two-row nominee slider section
- **SiteFooter.astro** - Footer with nav, copy, social links, credits

### React Components (`.tsx`)

Hydrated client-side via Astro `client:load` directives.

- **SocialLinks.tsx** - Reusable social icon bar (Instagram, Facebook, X, LinkedIn, WhatsApp) with SVG icons
- **LoopSliders.tsx** - Exports `CategorySlider`, `FeaturedNomineeSlider`, `NomineeEntrySlider` using Swiper
- **HeroLiveBackground.tsx** - Animated particle/canvas background for the hero section
- **JourneyImageSlider.tsx** - Mobile-only image carousel for journey photos

---

## Styling

The project uses **Tailwind CSS v4** with a custom theme defined in `src/styles/global.css`.

### Design Tokens

```css
@theme {
  --color-gbe-gold: #ffb001;
  --color-gbe-gold-soft: #e0b03c;
  --color-gbe-gold-deep: #6a4c1a;
  --color-gbe-gold-bright: #ffd05a;
  --color-gbe-muted: #d8d8d8;
  --color-gbe-panel: #050505;
  --color-gbe-footer: #1b1b1b;
  --font-sans: "Tajawal", system-ui, sans-serif;
  --font-script: "Tangerine", cursive;
}
```

### Custom Utilities

- `container-gbe` - Centered container with max-width (1260px desktop, 92vw tablet)
- `gold-text` - Gold gradient text clip effect
- `gold-fill` - Gold gradient background fill
- `btn-gold` / `btn-gold-hover` - Reusable gold gradient button with glow shadow

### Approach

Most styling is done inline via Tailwind utility classes in `.astro` and `.tsx` files. Shared patterns (buttons, gold text, container) use custom `@utility` definitions. Swiper overrides and keyframe animations are defined outside layers with `!important` where needed to win the cascade over Swiper's bundled CSS.

---

## Assets

All static assets live in `public/assets/` and are organised by purpose:

| Directory | Contents | Count |
|---|---|---|
| `brand/` | Logo, trophy, award icon, favicons (32px, 192px, 270px, apple-touch) | 15 |
| `journey/` | Interview, award-in-hand, red-carpet photos (multiple resolutions) | 14 |
| `nominees/` | Nominee portraits and company logos (multiple resolutions) | 45 |

Assets are referenced via the `assetPaths` object in `src/data/home.ts`. Multi-resolution variants follow the naming convention: `[name].webp`, `[name]-small.webp` (150px), `[name]-medium.webp` (768px), `[name]-large.webp` (1024px), `[name]-full.webp` (original).

---

## SEO

Each page includes:
- Unique `<title>` and `<meta name="description">`
- `<meta name="keywords">` on the homepage
- Open Graph tags (`og:type`, `og:title`, `og:description`, `og:image`, `og:url`)
- Twitter Card tags
- `<link rel="canonical">`
- Proper `<meta name="robots">` directives

The homepage additionally includes:
- JSON-LD structured data (Schema.org `Event` type with dual locations: London GB + Colombo LK)
- `<link rel="manifest">` pointing to `site.webmanifest`
- `<meta name="theme-color">`

Infrastructure files in `public/`:
- `robots.txt` - Allows all crawlers, points to sitemap
- `sitemap.xml` - All 6 indexable routes with priority and changefreq
- `site.webmanifest` - PWA manifest with icons and theme colour

---

## Build and Deploy

```bash
# Production build (outputs to ./dist/)
npm run build

# Preview the production build locally
npm run preview
```

The build generates static HTML for all 7 pages. The output in `dist/` can be deployed to any static hosting provider (Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any S3-compatible host).

### Deployment Checklist

- Verify all 7 pages build without errors
- Confirm `robots.txt`, `sitemap.xml`, and `site.webmanifest` are present in `dist/`
- Test on mobile (390px), tablet (768px), and desktop (1440px) viewports
- Validate favicon displays correctly in browser tab
- Check that all internal links resolve (no 404s)

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Astro dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run astro` | Run Astro CLI commands directly |

---

## License

This project is proprietary. All rights reserved by London Business Consultancy.

Website developed by [Codezela Technologies](https://codezela.com).

&copy; 2026 Global Business Excellence Awards.
