# Global Business Excellence Awards Website

Official website for the **Global Business Excellence Awards 2026**, organised by **London Business Consultancy** in **London, UK**.

This repo is a production Astro site with:
- public marketing pages
- a protected admin CMS
- Neon Postgres via Drizzle
- Better Auth for admin login
- Cloudflare R2 media storage
- shared SEO/structured-data infrastructure
- Google Analytics on public pages only

## Current State

- Public routes: `/`, `/about`, `/contact`, `/nominees`, `/previous-winners`, `/privacy-policy`, `/404`
- Protected routes: `/gbe-admin-safe/*`, `/api/gbe-admin-safe/*`, `/api/auth/*`
- Public nominee and winner content is DB-backed
- Previous winners are imported from the live legacy site and stored locally in Postgres
- Winner images are stored on the project media domain, not left on legacy WordPress URLs
- Admin/auth surfaces are explicitly noindexed

## Stack

- `astro` 6
- `@astrojs/react`
- `@astrojs/vercel`
- `tailwindcss` v4 via `@tailwindcss/vite`
- `react` 19
- `swiper`
- `better-auth`
- `drizzle-orm`
- `@neondatabase/serverless`
- Cloudflare R2 via `@aws-sdk/client-s3`

## Commands

```bash
npm install
npm run dev
npm run build
```

Useful project scripts:

```bash
npm run seed:admin       # create/check the first admin user
npm run import:winners   # import real previous winners from gbeaward.com
npm run r2:migrate-images
```

Notes:
- `npm run build` is the required verification command before shipping changes.
- `npm run preview` is currently **not supported** with the configured Vercel adapter.

## Environment

Copy `.env.example` to `.env` and fill in the real values.

Required:

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
PUBLIC_SITE_URL=
R2_BUCKET=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_BASE_URL=
```

Optional:

```env
ALLOW_ADMIN_SIGNUP=false
PUBLIC_GOOGLE_TAG_ID=GT-W6V9ZG59
```

Notes:
- `BETTER_AUTH_URL` and `PUBLIC_SITE_URL` should match the environment you are running in.
- `PUBLIC_GOOGLE_TAG_ID` is optional because the repo currently falls back to `GT-W6V9ZG59`.
- `ALLOW_ADMIN_SIGNUP` should stay disabled outside controlled setup flows.

## Architecture

### Public content

- `src/pages/index.astro`
- `src/pages/nominees.astro`
- `src/pages/previous-winners.astro`
- `src/lib/public-content.ts`

Homepage structure and static brand data still live in `src/data/home.ts`, but nominee/winner cards shown publicly come from the database.

### Admin CMS

- `src/pages/gbe-admin-safe/index.astro`
- `src/pages/gbe-admin-safe/overview.astro`
- `src/pages/gbe-admin-safe/winners.astro`
- `src/pages/gbe-admin-safe/nominations.astro`
- `src/components/admin/ContentManager.tsx`
- `src/components/admin/AdminForm.tsx`

The admin uses in-app modals and toasts. Native browser `alert`/`confirm` popups have been removed from the current UI flow.

### Database

- `src/lib/db/schema.ts`
- `src/lib/db/index.ts`

Main tables:
- `past_winners`
- `nominations`
- Better Auth tables: `user`, `session`, `account`, `verification`

### Auth

- `src/lib/auth.ts`
- `src/lib/admin/auth.ts`
- `src/pages/api/auth/[...all].ts`

### Media storage

- `src/lib/admin/r2.ts`
- `src/pages/api/gbe-admin-safe/upload.ts`

Admin image uploads go to Cloudflare R2 and are served from `R2_PUBLIC_BASE_URL`.

### SEO and analytics

- `src/components/SeoHead.astro`
- `src/lib/seo.ts`
- `src/components/GoogleAnalytics.astro`
- `src/pages/sitemap.xml.ts`
- `src/middleware.ts`

What is implemented:
- canonical tags
- robots directives
- Open Graph and Twitter cards
- JSON-LD structured data
- generated sitemap
- protected-route `X-Robots-Tag`
- Google Analytics on public pages only

## Winner Import Workflow

Real previous winners are imported by:

- `scripts/import-live-winners.ts`

What it does:
- fetches real winner posts from the live WordPress API
- reads the winner detail page heading to capture the actual award title
- uploads remote winner images into the project R2 bucket
- upserts winners into `past_winners`
- archives local winner rows no longer present in the live source

This replaced the old fake content seeding path.

## Styling Conventions

- Theme and shared utilities live in `src/styles/global.css`
- Use `gold-text` for gold gradient typography
- Use `btn-gold` and `btn-gold-hover` for shared CTA styling
- Use `container-gbe` for standard content width
- Swiper override rules must stay outside Tailwind layers

## Verification Checklist

Before marking work complete:

```bash
npm run build
```

Then verify:
- public pages still render
- admin routes still require auth
- winners and nominees still load from DB
- noindex remains on admin/auth routes
- imported winner images resolve from the media domain
- analytics tag appears on public routes only

## Launch Notes

Before final domain cutover:
- set final production values in `.env`
- confirm `BETTER_AUTH_URL` and `PUBLIC_SITE_URL` use the production domain
- optionally set `PUBLIC_GOOGLE_TAG_ID` explicitly in production env
- run `npm run build`
- verify homepage, nominees, previous winners, sitemap, robots, and admin login after deploy

## Repo Truths

- This is **not** a static-only site anymore.
- This is **not** a Tailwind config file repo; Tailwind v4 theme lives in CSS.
- `public/sitemap.xml` is no longer the source of truth; sitemap is generated from Astro.
- `scripts/seed-content.ts` has been removed and should not be reintroduced.
