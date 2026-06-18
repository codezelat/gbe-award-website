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
- Journey: three abstract dark media placeholders matching the live screenshot, paragraph, empty gold-outline CTA pill.
- Nominees: black/gold cards with title, name, circular portrait placeholders, Tangerine `Congratulations!`, local award icon.
- Footer: dark gray centered title, nav, paragraph, social icons, privacy, copyright, developer credit.

## Assets
- Logo: `/assets/live/logo-e1738704108777-195x300-33756ccd0b.png`
- Trophy: `/assets/live/trophy-4x-1-png-06b29f01c0.webp`
- Award icon: `/assets/live/award-small-img-300x300-png-bea10b6124.webp`
- Favicons: `/assets/live/cropped-gbe-awards-logo-*.png`

## Typography and Colors
- Body/UI font: Tajawal, local `@fontsource`.
- Script font: Tangerine, local `@fontsource`.
- Background: `#000`, section darks `#050505`, `#060606`, footer `#1b1b1b`.
- Gold: `#ffb001`, muted title gold `#e0b03c`, deep gold border `rgba(255, 176, 1, .72)`.

## Responsive Behavior
- Desktop 1440px: header/nav centered, two hero trophies, 3-card category row, 3-column nominee grid.
- Tablet/mobile: nav collapses to hamburger, hero uses single trophy, cards stack or become single-track, nominees become one clean column to avoid the original live carousel overflow.
