<p align="center">
  <img src="public/assets/brand/gbe-logo.webp" alt="Global Business Excellence Awards logo" width="96" />
</p>

<h1 align="center">Global Business Excellence Awards 2026</h1>

<p align="center">
  <strong>Official website and admin CMS for the Global Business Excellence Awards 2026.</strong><br />
  Organised by <strong>London Business Consultancy</strong>, London, UK.
</p>

<p align="center">
  <a href="https://gbeaward.com">🌐 gbeaward.com</a>
  ·
  <a href="https://media.gbeaward.com">🖼️ media.gbeaward.com</a>
</p>

---

## 🏆 About the Project

This repository powers the public marketing website and protected content-management system for the **Global Business Excellence Awards 2026**. The platform presents the awards brand, nominee profiles, previous winners, editorial winner stories, contact pathways, SEO metadata, analytics, and a secure admin surface for managing awards content.

The site is built as a production Astro application, not a static brochure. Public nominee and previous-winner content is backed by Postgres, winner media is delivered from Cloudflare R2, and protected admin/auth routes are excluded from indexing.

## ✨ What It Includes

- 🏠 Public marketing pages for the awards programme
- 🏅 DB-backed nominee and previous-winner directories
- 📰 Canonical winner-story pages with editorial SEO fields
- 🔐 Protected admin CMS at `/gbe-admin-safe`
- 🗃️ Neon Postgres schema managed with Drizzle ORM
- 🖼️ Cloudflare R2 uploads and media CDN delivery
- 🔎 Canonical URLs, Open Graph, Twitter cards, sitemap, and JSON-LD
- 📊 Google Analytics on public pages only
- 🚫 `noindex` and `no-store` protections for admin/auth surfaces
- 🎨 Dark/light themed GBE visual system with self-hosted brand assets

## 🧭 Public Website

Core public routes:

| Route | Purpose |
| --- | --- |
| `/` | Awards homepage and primary brand story |
| `/about` | Programme overview, purpose, and judging journey |
| `/nominees` | Published nominees from the database |
| `/previous-winners` | Published previous-winner directory |
| `/previous-winners/[slug]` | Canonical winner-story article pages |
| `/contact` | Enquiry and application contact page |
| `/privacy-policy` | Privacy policy |
| `/sitemap.xml` | Generated public sitemap |

## 🛠️ Admin CMS

The admin area lives behind Better Auth and is intentionally hidden from search engines.

| Route | Purpose |
| --- | --- |
| `/gbe-admin-safe/` | Admin login |
| `/gbe-admin-safe/overview` | Admin dashboard |
| `/gbe-admin-safe/winners` | Previous-winner and story management |
| `/gbe-admin-safe/nominations` | Nomination management |
| `/api/gbe-admin-safe/*` | Protected admin API endpoints |
| `/api/auth/*` | Better Auth endpoints |

Admin UI rules:

- Use in-app dialogs, modals, and toasts for confirmations.
- Do not use browser `alert`, `confirm`, or `prompt`.
- Keep admin/auth routes `noindex`, `nofollow`, `noarchive`, and `nosnippet`.
- Keep admin responses `Cache-Control: no-store`.

## ⚙️ Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Astro 6 with `output: "server"` |
| Islands | React 19 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| UI Motion | Motion |
| Carousels | Swiper 12 |
| Database | Neon Postgres |
| ORM | Drizzle ORM |
| Auth | Better Auth |
| Media | Cloudflare R2 through AWS S3 SDK |
| Rich Text | TipTap |
| Validation | Zod |
| Deployment Adapter | `@astrojs/vercel` |
| Runtime | Node.js `>=22.12.0` |

## 📁 Project Structure

```text
src/
  components/              Shared Astro, React, admin, SEO, and layout components
  components/admin/        Protected CMS interface components
  data/home.ts             Brand assets, nav items, homepage copy, shared SEO copy
  lib/admin/               Admin auth, content actions, and R2 upload helpers
  lib/db/                  Drizzle client and database schema
  lib/winners/             Winner story content, SEO, query, image, and slug logic
  pages/                   Public pages, admin pages, API routes, and sitemap
  styles/global.css        Tailwind v4 theme, utilities, animations, and overrides

public/
  assets/brand/            Logo, icons, trophy, favicon, and brand media
  assets/journey/          Homepage journey visuals
  assets/nominees/         Local nominee media assets
  robots.txt
  site.webmanifest

scripts/
  import-live-winners.ts   Imports real winners from the legacy WordPress source
  migrate-images-to-r2.ts  Moves existing image URLs into R2
  seed-admin.ts            Creates the controlled first admin account
```

## 🗄️ Database Content Model

Primary tables:

- `past_winners`
- `winner_slug_aliases`
- `nominations`
- Better Auth tables: `user`, `session`, `account`, `verification`

Winner-story content lives in `past_winners`, including headline, standfirst, rich-text body, source notes, SEO title, SEO description, social image, hero image, indexing status, and canonical slug. Old slugs are preserved in `winner_slug_aliases` so changed story URLs can redirect cleanly.

## 📰 Winner Story Rules

Winner stories are editorial records, not generated JSON files committed to the repository.

- Store article content in the database/admin workflow.
- Manage the complete article record from `/gbe-admin-safe/winners`: headline, standfirst, rich-text body, byline, dates, source notes, links, media, and SEO controls are all editable there.
- Set `indexingStatus=index` only after the story is published, fact-checked, source-backed, and specific to that winner. The CMS blocks incomplete stories and newly introduced substantial copy reused from another indexed story.
- Source notes are shown publicly on winner articles as a transparent evidence trail. Use accurate source URLs or precise citations only.
- Keep `imageUrl` as the card/profile image.
- Use `heroImageUrl` only for a separate wide story banner.
- Preserve slug aliases when canonical slugs change. The CMS automatically retains the previous canonical slug as a permanent redirect and refuses URLs owned by another winner or alias.
- Use `indexingStatus=index` only for quality-approved, source-backed stories.
- Keep weak-source, identity-risk, or wrong-image-risk stories as `noindex`.
- Do not invent quotes, judge comments, audience numbers, rankings, or unsupported claims.
- Do not use winner `market` values in story URLs, filters, labels, article copy, metadata, schema, or keyword strategy.
- Do not commit generated `content/winner-stories/` or `content/winner-research/` exports.

## 🖼️ Media and Assets

Brand assets are stored under `public/assets/brand/` and referenced through `assetPaths` in `src/data/home.ts`.

Uploaded/admin-managed media is stored in **Cloudflare R2** and served from `R2_PUBLIC_BASE_URL`, currently intended for `https://media.gbeaward.com`.

R2-backed uploads are handled by:

- `src/lib/admin/r2.ts`
- `src/pages/api/gbe-admin-safe/upload.ts`

## 🔎 SEO and Analytics

SEO infrastructure is centralized across:

- `src/components/SeoHead.astro`
- `src/lib/seo.ts`
- `src/lib/site.ts`
- `src/lib/winners/seo.ts`
- `src/pages/sitemap.xml.ts`
- `src/middleware.ts`

Implemented SEO features:

- Canonical URLs
- Meta descriptions
- Open Graph tags
- Twitter card tags
- JSON-LD structured data
- Generated sitemap
- Image sitemap entries for winner stories
- Public-only Google Analytics
- Protected-route `X-Robots-Tag` headers

## 🎨 Design System

The visual system lives in `src/styles/global.css`.

Use the existing utilities:

- `container-gbe` for page width
- `gold-text` for gold-gradient headings
- `gold-fill` for gold-gradient filled elements
- `btn-gold` and `btn-gold-hover` for primary CTAs

Important styling conventions:

- Tailwind v4 config is CSS-based through `@theme`; do not add `tailwind.config.js`.
- Shared colours use `gbe-` tokens.
- Swiper overrides must stay outside Tailwind layers so they beat bundled Swiper CSS.
- Body copy should stay at normal readable weights; avoid heavy `700+` body text.
- Keep dark and light themes intentional, accessible, and brand-consistent.

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Copy `.env.example` to `.env` and fill in real values.

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require&channel_binding=require"
BETTER_AUTH_SECRET="replace-with-a-strong-random-secret"
BETTER_AUTH_URL="http://127.0.0.1:4321"
ADMIN_EMAIL="admin@gbeaward.com"
ADMIN_PASSWORD="replace-before-production"
PUBLIC_SITE_URL="http://127.0.0.1:4321"
R2_BUCKET="gbeaward-web"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="replace-with-r2-access-key"
R2_SECRET_ACCESS_KEY="replace-with-r2-secret-key"
R2_PUBLIC_BASE_URL="https://media.gbeaward.com"
PUBLIC_GOOGLE_TAG_ID="GT-W6V9ZG59"
ALLOW_ADMIN_SIGNUP="false"
```

### 3. Run locally

```bash
npm run dev
```

Astro starts on `http://localhost:4321` unless that port is already in use.

### 4. Create the first admin user

```bash
npm run seed:admin
```

This script temporarily enables admin signup for the controlled seed flow. Keep `ALLOW_ADMIN_SIGNUP=false` outside setup.

## 🧪 Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local Astro development server |
| `npm run build` | Build the production server output |
| `npm run test` | Run Vitest tests |
| `npm run test:winners` | Run winner-specific tests |
| `npm run test:e2e` | Run Playwright winner route tests |
| `npm run seed:admin` | Create/check the first admin account |
| `npm run import:winners` | Import real previous winners from the legacy live site |
| `npm run backfill:winner-aliases` | Store legacy winner URLs as indexed redirect aliases |
| `npm run r2:migrate-images` | Move winner/nomination images into R2 |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio |

`npm run preview` is not the supported verification path for this project because the Vercel adapter is configured for server output.

## Public caching

Public DB-backed pages send a one-day browser cache lifetime and a one-year
Vercel/downstream CDN lifetime with stale-while-revalidate. Winner and
nomination responses also carry scoped Vercel cache tags. Provider caches are
cleared manually when public content changes. Admin and auth responses remain
`no-store`.

Before deploying the indexed legacy-redirect query for the first time, run:

```bash
DRY_RUN=true npm run backfill:winner-aliases
npm run backfill:winner-aliases
```

## 🔁 Winner Import Workflow

Real previous winners are imported with:

```bash
npm run import:winners
```

The importer:

- Fetches winner records from the legacy WordPress API at `gbeaward.com`.
- Reads winner detail pages to capture the actual award heading.
- Uploads remote winner images into the project R2 bucket.
- Upserts source identity and media fields into `past_winners`.
- Keeps winner `market` values cleared.
- Does not overwrite human-managed story body, headline, standfirst, canonical slug, SEO story fields, or article body.
- Archives missing local winners only when `ALLOW_ARCHIVE_MISSING_WINNERS=true`.

## ✅ Verification

Before finishing any code or content-system change:

```bash
npm run build
```

Recommended checks for larger changes:

- Public pages render without framework errors.
- `/previous-winners` and `/nominees` read from the database.
- Admin routes redirect unauthenticated users.
- Admin/auth responses include `X-Robots-Tag`.
- Public pages include SEO metadata and analytics only where intended.
- Winner images resolve from the media CDN.
- Sitemap includes public static routes and indexable winner stories.

## 🚢 Deployment Notes

The Astro config is set for:

- Production site: `https://gbeaward.com`
- Server output through `@astrojs/vercel`
- Node.js `>=22.12.0`

Before production deployment:

- Set production `DATABASE_URL`.
- Set production `BETTER_AUTH_URL`.
- Set production `PUBLIC_SITE_URL`.
- Set R2 bucket, endpoint, access key, secret key, and public base URL.
- Keep `ALLOW_ADMIN_SIGNUP=false`.
- Run `npm run build`.
- Verify homepage, about, nominees, previous winners, winner story pages, sitemap, robots, contact, and admin login.

## 🔒 Security and Indexing

- Admin pages require a valid Better Auth session.
- Admin API endpoints use protected route boundaries.
- Admin/auth surfaces receive `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`.
- Admin/auth surfaces use `Cache-Control: no-store`.
- Signup is disabled unless `ALLOW_ADMIN_SIGNUP=true`.
- R2 upload configuration is read from environment variables.

## 🤝 Credits

**Global Business Excellence Awards 2026** is organised by **London Business Consultancy**, London, UK.

Website development credit links to [Codezela Technologies](https://codezela.com).

## 📌 Maintainer Notes

- Treat imported previous winners as real production content.
- Keep public nominees and winners database-backed.
- Keep homepage brand data in `src/data/home.ts`.
- Keep public SEO through shared helpers instead of page-by-page one-offs.
- Do not reintroduce fake winner or nominee seeding.
- Do not add the default Astro SVG favicon as the site favicon.
- Do not add geography-driven winner-story URL or keyword strategies.
