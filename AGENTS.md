# AGENTS.md

## Project

GBE Awards website for the Global Business Excellence Awards 2026, organised by London Business Consultancy (London, UK). A static marketing site with 7 pages, built with Astro + React islands + Tailwind CSS v4.

## Tech Stack

- **Astro 6** (static output) with **React 19** integration for interactive components
- **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config.js`; theme is in `global.css` via `@theme`)
- **Swiper 12** for carousels (imported as React component, CSS imported in TSX)
- **Fonts**: Tajawal (body/UI) and Tangerine (script headings), self-hosted via `@fontsource`
- **TypeScript** strict mode (`astro/tsconfigs/strict`)
- Node >= 22.12.0

## Commands

```bash
npm run dev      # Dev server at localhost:4321
npm run build    # Production build to ./dist/ (must pass before completing any task)
npm run preview  # Preview the production build
```

## How to Verify

Always run `npm run build` before finishing. The build must output 7 pages with zero errors. If a page does not appear in the build output, something is broken.

## Architecture

- `src/data/home.ts` is the **single source of truth** for asset paths, nav items, categories, nominees, and SEO metadata. If you need to add or change content data, edit this file.
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

## Content

- The organising entity is **London Business Consultancy** based in **London, UK**.
- Awards cover the **UK, Sri Lanka, and international markets**.
- The current award year is **2026**.
- Developer credit in footer links to [Codezela Technologies](https://codezela.com).
