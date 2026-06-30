# AGENTS.md

## Project

GBE Awards website for the Global Business Excellence Awards 2026, organised by London Business Consultancy (London, UK). A public-facing marketing site plus protected admin CMS, built with Astro + React islands + Tailwind CSS v4, backed by Neon Postgres and Cloudflare R2.

## Tech Stack

- **Astro 6** (`output: "server"`) with **React 19** integration for interactive components
- **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config.js`; theme is in `global.css` via `@theme`)
- **Swiper 12** for carousels (imported as React component, CSS imported in TSX)
- **Fonts**: Tajawal (body/UI) and Tangerine (script headings), self-hosted via `@fontsource`
- **Drizzle ORM** + **Neon Postgres** for winners, nominations, and auth tables
- **Better Auth** for protected admin login
- **Cloudflare R2** for uploaded/media CDN assets
- **TypeScript** strict mode (`astro/tsconfigs/strict`)
- Node >= 22.12.0

## Commands

```bash
npm run dev      # Dev server at localhost:4321
npm run build    # Production build to ./dist/ (must pass before completing any task)
npm run seed:admin
npm run import:winners
npm run export:winner-research
npm run import:winner-stories -- --check
npm run import:winner-stories
npm run r2:migrate-images
```

`npm run preview` is currently not supported by the configured `@astrojs/vercel` adapter.

## How to Verify

Always run `npm run build` before finishing. Public pages, admin routes, and server entrypoints must build with zero errors.

## Architecture

- `src/data/home.ts` is the source of truth for brand assets, nav items, static homepage content, and shared SEO copy.
- `src/lib/public-content.ts` is the public data layer for nominees and previous winners. Public nominee and winner cards are DB-backed, not hardcoded.
- `src/lib/winners/*` owns winner-story slugs, sanitization, quality checks, public queries, and article SEO.
- `src/lib/db/schema.ts` defines the app tables, including `past_winners`, `nominations`, and Better Auth tables.
- `src/components/SeoHead.astro` is the shared public SEO head path.
- `src/components/GoogleAnalytics.astro` injects analytics on public pages only.
- `src/middleware.ts` protects admin/auth surfaces and applies `X-Robots-Tag` noindex headers there.
- `src/styles/global.css` contains the Tailwind theme, custom `@utility` definitions (`container-gbe`, `gold-text`, `gold-fill`, `btn-gold`), component styles, and keyframe animations.
- Assets are in `public/assets/{brand,journey,nominees}/` with semantic names. Referenced via `assetPaths` in `home.ts`.
- Astro components (`.astro`) render at build time. React components (`.tsx`) are hydrated via `client:load`.
- Pages import `../styles/global.css` directly in their frontmatter.

## Key Patterns

- **Gold gradient text**: use the `gold-text` utility class. Never hardcode gold gradient inline.
- **Buttons**: use `btn-gold btn-gold-hover` utility classes. Do not write custom button styles inline.
- **Containers**: use `container-gbe` for the standard page-width wrapper.
- **Swiper overrides**: must be defined OUTSIDE `@layer` in `global.css` with `!important`, because Swiper's bundled CSS is imported separately and wins the cascade inside layers.
- **Social icons**: all SVGs live in `SocialLinks.tsx`. Do not use external icon files.
- **Admin confirmations**: use in-app dialogs/modals, not browser `alert`/`confirm`/`prompt`.

## CSS Conventions

- Tailwind utility classes are used inline in Astro/TSX templates for most styling.
- Shared visual patterns (buttons, gold text, container, swiper, animations) live in `global.css`.
- Custom theme colours are prefixed `gbe-` (e.g., `text-gbe-gold`, `bg-gbe-panel`, `text-gbe-muted`).
- Responsive breakpoints use `max-[1024px]` (tablet) and `max-[560px]` (mobile) Tailwind variants.

## Do Not

- Do not create a `tailwind.config.js`. Tailwind v4 uses CSS-based config via `@theme`.
- Do not use `font-weight: 700+` on body text. Body copy is `400` or `500`. Headings use `700` or `900`.
- Do not use `overflow: hidden` on `.gbe-swiper` containers (it clips card hover effects).
- Do not reference asset paths with the old `/assets/live/` prefix. Use the semantic names in `assetPaths`.
- Do not add `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`. The SVG is the Astro default, not the GBE logo.
- Do not reintroduce fake content seeding for winners or nominees.
- Do not put analytics on `/gbe-admin-safe`, `/api/gbe-admin-safe`, or `/api/auth`.
- Do not use winner `market` values in winner-story URLs, filters, UI labels, article copy, metadata, schema, or keyword strategy.
- Do not overwrite winner-story editorial fields from `scripts/import-live-winners.ts`; use `scripts/import-winner-stories.ts` and JSON packages instead.

## Content

- The organising entity is **London Business Consultancy** based in **London, UK**.
- Awards cover the **UK, Sri Lanka, and international markets**.
- The current award year is **2026**.
- Developer credit in footer links to [Codezela Technologies](https://codezela.com).
- Real previous winners are imported from the legacy live site into local Postgres and should be treated as the source for the new site after import.
- Winner stories live in `content/winner-stories/2025/*.json` and import by immutable winner ID.
- Old winner slugs are retained as aliases when canonical story slugs change.
- Only quality-approved, source-backed stories should use `indexingStatus=index`; weak-source, identity-risk, or wrong-image-risk records should remain `noindex`.
- Never invent quotes, judge comments, audience numbers, biographical claims, or ranking claims for winner stories.
