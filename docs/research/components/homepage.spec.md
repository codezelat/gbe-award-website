# Homepage Specification

## Overview
- Target files: `src/pages/index.astro`, `src/components/*`, `src/styles/global.css`
- Reference screenshots: `docs/design-references/gbeaward-home-desktop-1440.png`, `docs/design-references/gbeaward-home-mobile-390.png`
- Interaction model: static page with link/hover interactions, CSS scroll-reveal, category track, and responsive mobile header.

## Sections
- Header: black background, local GBE logo, centered pill navigation, gold Apply Now pill, mobile logo plus hamburger.
- Hero: black full-height opening with paired trophy assets on desktop, one trophy on mobile, centered title, description, gold CTA, and social pill.
- About: dark band with gold border text card, mandala-style background texture, and right-aligned title on desktop.
- Categories: centered heading/subtitle, gold-bordered category cards using the local award icon, carousel dots.
- Journey: three real journey images from `public/assets/journey/`, paragraph copy, and gold-outline CTA styling when a CTA is present.
- Nominees: DB-backed black/gold nominee cards with title, name, circular portraits when available, Tangerine `Congratulations!`, and local award icon fallback.
- Footer: dark gray centered title, nav, paragraph, social icons, privacy, copyright, developer credit.

## Assets
- Logo: `/assets/brand/gbe-logo.webp`
- Trophy: `/assets/brand/hero-award-2026.webp`
- Award icon: `/assets/brand/award-icon.webp`
- Favicon: `/assets/brand/favicon-192.png`

Current implementation resolves these through `assetPaths` in `src/data/home.ts`.
Do not reintroduce the old `/assets/live/` paths from the legacy capture.

## Typography and Colors
- Body/UI font: Tajawal, local `@fontsource`.
- Script font: Tangerine, local `@fontsource`.
- Background: `#000`, section darks `#050505`, `#060606`, footer `#1b1b1b`.
- Gold: `#ffb001`, muted title gold `#e0b03c`, deep gold border `rgba(255, 176, 1, .72)`.

## Responsive Behavior
- Desktop 1440px: header/nav centered, two hero trophies, 3-card category row, 3-column nominee grid.
- Tablet/mobile: nav collapses to hamburger, hero uses single trophy, cards stack or become single-track, nominees become one clean column to avoid the original live carousel overflow.
