# Winner Stories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete DB-backed winner-story publishing system and publish source-backed, individually optimized stories for all 59 imported 2025 winners.

**Architecture:** Extend `past_winners` with structured editorial, recipient, image, publishing, and verification fields while keeping it the single source of truth. Public Astro routes render a lightweight directory and canonical server-rendered article pages; React is limited to the protected admin editor. A controlled content package and idempotent import script populate researched legacy stories without allowing future live imports to overwrite human editorial work.

**Tech Stack:** Astro 6 server output, React 19 islands, Tailwind CSS v4, Drizzle ORM, Neon Postgres, Zod, Tiptap, sanitize-html, Cloudflare R2, Vitest, Playwright, GA4.

---

## File Map

**Create**

- `drizzle/0001_winner_stories.sql`: additive winner-story schema migration and alias table.
- `src/lib/winners/types.ts`: public/editorial types and rich-text schema.
- `src/lib/winners/content.ts`: sanitization, completeness checks, headline/slug generation, and keyword helpers.
- `src/lib/winners/queries.ts`: public winner directory, detail, alias, and related-story queries.
- `src/lib/winners/seo.ts`: article graph and metadata builders.
- `src/components/WinnerStoryCard.astro`: accessible linked directory card.
- `src/components/WinnerStoryArticle.astro`: minimal long-form article renderer.
- `src/components/WinnerShareLinks.astro`: ordinary-link sharing and analytics attributes.
- `src/components/admin/WinnerStoryEditor.tsx`: Tiptap-based constrained article editor.
- `src/pages/previous-winners/[slug].astro`: canonical story route and legacy alias redirects.
- `src/pages/api/gbe-admin-safe/winners/[id]/preview.ts`: protected draft preview payload.
- `src/pages/api/gbe-admin-safe/winners/[id]/quality.ts`: protected quality report.
- `src/pages/api/analytics.ts`: optional first-party event boundary only if direct GA link events prove insufficient.
- `scripts/export-winner-research.ts`: export stable source records for research workers.
- `scripts/import-winner-stories.ts`: validate and idempotently import editorial packages.
- `content/winner-stories/2025/*.json`: one researched, reviewable source package per award win.
- `tests/winners/content.test.ts`: content validation and slug tests.
- `tests/winners/queries.test.ts`: query behavior with a mocked DB boundary.
- `tests/winners/seo.test.ts`: metadata and JSON-LD tests.
- `tests/winners/import.test.ts`: editorial import overwrite protections.
- `tests/winners/routes.spec.ts`: Playwright public-route and redirect checks.

**Modify**

- `package.json` and `package-lock.json`: editor, sanitizer, test dependencies and scripts.
- `src/lib/db/schema.ts`: winner-story columns, enums, indexes, and aliases.
- `src/lib/admin/content.ts`: expanded validation and editorial-safe updates.
- `src/lib/public-content.ts`: delegate winner reads to the winner query module and include slugs.
- `src/lib/seo.ts`: remove invalid generic award entry graph and share common helpers.
- `src/components/SeoHead.astro`: article publication metadata where applicable.
- `src/components/admin/ui.tsx`: expanded winner/form types and reusable quality UI.
- `src/components/admin/AdminForm.tsx`: winner-specific editorial sections and preview controls.
- `src/components/admin/ContentManager.tsx`: quality/indexing badges and preview links.
- `src/pages/previous-winners.astro`: filters, pagination, and linked cards.
- `src/pages/sitemap.xml.ts`: published/indexable dynamic stories and image entries.
- `src/styles/global.css`: restrained article typography, card affordance, and reduced motion.
- `scripts/import-live-winners.ts`: never overwrite human editorial fields or canonical slugs.
- `README.md`, `AGENTS.md`, `.env.example`: workflow and operational contract.

## Task 1: Establish Test and Dependency Baseline

- [ ] **Step 1: Add runtime and test dependencies**

Run:

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder sanitize-html
npm install -D @types/sanitize-html vitest @vitest/coverage-v8
```

Expected: lockfile updates with no peer-dependency errors.

- [ ] **Step 2: Add deterministic test scripts**

Add to `package.json`:

```json
"test": "vitest run",
"test:winners": "vitest run tests/winners",
"test:e2e": "playwright test tests/winners/routes.spec.ts"
```

- [ ] **Step 3: Add a failing content contract test**

Create `tests/winners/content.test.ts` with assertions that a generated slug includes recipient, award, and year; unsafe HTML is removed; and an incomplete story cannot be indexed.

```ts
expect(buildWinnerSlug("Hiru TV", "Most Popular Television Channel of the Year", 2025))
  .toBe("hiru-tv-wins-most-popular-television-channel-of-the-year-2025");
expect(sanitizeWinnerHtml('<p>Safe</p><script>alert(1)</script>')).toBe("<p>Safe</p>");
expect(evaluateWinnerQuality(incompleteWinner).indexable).toBe(false);
```

- [ ] **Step 4: Run the focused test and verify failure**

Run `npm run test:winners`.

Expected: failure because `src/lib/winners/content.ts` does not exist.

- [ ] **Step 5: Commit the baseline**

```bash
git add package.json package-lock.json tests/winners/content.test.ts
git commit -m "test: define winner story content contract"
```

## Task 2: Add the Additive Database Model

- [ ] **Step 1: Extend `past_winners` and add aliases**

Add enums and nullable columns in `src/lib/db/schema.ts`. Use `jsonb` for Tiptap JSON and text arrays for highlights/source notes:

```ts
export const recipientType = pgEnum("recipient_type", ["person", "organization"]);
export const indexingStatus = pgEnum("indexing_status", ["noindex", "index"]);

recipientType: recipientType("recipient_type"),
headline: text("headline"),
standfirst: text("standfirst"),
body: jsonb("body").$type<WinnerRichText>(),
officialWebsiteUrl: text("official_website_url"),
industry: text("industry"),
location: text("location"),
awardCitation: text("award_citation"),
achievementHighlights: text("achievement_highlights").array(),
heroImageUrl: text("hero_image_url"),
heroImageAlt: text("hero_image_alt"),
heroImageCaption: text("hero_image_caption"),
heroImageCredit: text("hero_image_credit"),
authorName: text("author_name"),
publishedAt: timestamp("published_at", { withTimezone: true }),
contentUpdatedAt: timestamp("content_updated_at", { withTimezone: true }),
indexingStatus: indexingStatus("indexing_status").notNull().default("noindex"),
sourceNotes: text("source_notes").array(),
factCheckedAt: timestamp("fact_checked_at", { withTimezone: true }),
```

Create `winner_slug_aliases` with unique alias, winner FK with cascade, and timestamps.

- [ ] **Step 2: Generate and inspect the SQL migration**

Run `npm run db:generate`.

Expected: `drizzle/0001_*.sql` only adds columns, enum types, alias table, indexes, and constraints; it does not drop winner data.

- [ ] **Step 3: Add a migration backup check**

Before applying, query and save counts only in terminal output:

```sql
select status, count(*) from past_winners group by status;
```

Expected: 59 published and the existing archived count remains visible.

- [ ] **Step 4: Apply the migration**

Run `npm run db:migrate`.

Expected: migration succeeds once and is idempotently recorded by Drizzle.

- [ ] **Step 5: Verify record and media preservation**

Read all published IDs, names, awards, slugs, and image URLs and assert count `59` with no null recipient/award/slug values.

- [ ] **Step 6: Commit schema and migration**

```bash
git add src/lib/db/schema.ts drizzle
git commit -m "feat: add winner story publishing schema"
```

## Task 3: Implement Content Safety and Quality Rules

- [ ] **Step 1: Define rich-text and quality types**

Create `src/lib/winners/types.ts` with `WinnerRichText`, `WinnerStoryRecord`, `WinnerQualityIssue`, and `WinnerQualityReport`.

- [ ] **Step 2: Implement the tested helpers**

Create `src/lib/winners/content.ts` exporting:

```ts
export function buildWinnerSlug(recipient: string, award: string, year: number): string;
export function sanitizeWinnerHtml(html: string): string;
export function renderWinnerRichText(document: WinnerRichText): string;
export function evaluateWinnerQuality(winner: WinnerStoryRecord): WinnerQualityReport;
export function buildWinnerKeywordCluster(winner: WinnerStoryRecord): string[];
```

Allow only `p`, `h2`, `h3`, `ul`, `ol`, `li`, `strong`, `em`, `blockquote`, and `a`; allow only `http`, `https`, and `mailto` links; force safe external-link attributes.

- [ ] **Step 3: Enforce indexing rules**

`evaluateWinnerQuality` must reject indexing when the body is absent or under a meaningful unique-text threshold, source notes are absent, image alt is missing, publication/fact-check dates are missing, or SEO identity fields are incomplete. It reports field-specific reasons rather than silently changing status.

- [ ] **Step 4: Run content tests**

Run `npm run test:winners`.

Expected: slug, sanitization, and indexability tests pass.

- [ ] **Step 5: Commit content rules**

```bash
git add src/lib/winners tests/winners/content.test.ts
git commit -m "feat: enforce winner story content quality"
```

## Task 4: Build Winner Queries and Canonical Routing

- [ ] **Step 1: Write query tests**

Cover published canonical lookup, alias lookup, draft exclusion, archived exclusion, related-story ordering, pagination bounds, and DB failure behavior.

- [ ] **Step 2: Implement `src/lib/winners/queries.ts`**

Export focused functions:

```ts
getWinnerDirectory(input: { page: number; year?: number; market?: string; category?: string }): Promise<WinnerDirectoryResult>
getPublishedWinnerBySlug(slug: string): Promise<WinnerStoryRecord | null>
resolveWinnerSlug(slug: string): Promise<{ winner: WinnerStoryRecord; redirect: boolean } | null>
getRelatedWinners(winner: WinnerStoryRecord, limit?: number): Promise<WinnerCardData[]>
getIndexableWinnerUrls(): Promise<Array<{ slug: string; lastmod: Date; imageUrl?: string }>>
```

- [ ] **Step 3: Preserve old slugs as aliases**

When a canonical slug changes, insert the prior slug into `winner_slug_aliases` in the same transaction. Reject aliases that conflict with another canonical slug.

- [ ] **Step 4: Create the detail route**

`src/pages/previous-winners/[slug].astro` must:

- return 404 for missing, draft, or archived records;
- return HTTP 301 for an alias;
- set `public, s-maxage=300, stale-while-revalidate=86400` for canonical published stories;
- output `noindex,follow` when `indexingStatus` is `noindex`;
- render the full article server-side.

- [ ] **Step 5: Run query and route tests**

Run `npm run test:winners` and the focused Playwright route tests.

- [ ] **Step 6: Commit routing**

```bash
git add src/lib/winners src/pages/previous-winners tests/winners
git commit -m "feat: add canonical winner story routes"
```

## Task 5: Build Accurate Article SEO and Discovery

- [ ] **Step 1: Write schema tests**

Assert that the graph includes `WebPage`, `Article` or `NewsArticle`, recipient `Person`/`Organization`, `BreadcrumbList`, and the annual event; assert that visible headline, dates, canonical URL, and images match page data.

- [ ] **Step 2: Implement `src/lib/winners/seo.ts`**

Replace the invalid generic `Thing`/fake Award type. Use the recipient's schema.org `award` text property and stable `@id` references. `NewsArticle` is allowed only when explicitly marked timely; migrated stories default to `Article`.

- [ ] **Step 3: Extend `SeoHead.astro`**

Support `article:published_time`, `article:modified_time`, and optional author metadata without duplicating schema injection.

- [ ] **Step 4: Make the sitemap dynamic**

Update `src/pages/sitemap.xml.ts` to fetch indexable published winners, XML-escape values, emit canonical detail URLs with accurate `lastmod`, and include representative image locations. Remove ignored `priority` and `changefreq` values.

- [ ] **Step 5: Test escaping and index exclusion**

Verify special characters such as `&` and apostrophes produce valid XML; noindex, draft, and archived stories must not appear.

- [ ] **Step 6: Commit SEO and sitemap work**

```bash
git add src/lib/seo.ts src/lib/winners/seo.ts src/components/SeoHead.astro src/pages/sitemap.xml.ts tests/winners/seo.test.ts
git commit -m "feat: add winner article SEO and discovery"
```

## Task 6: Build the Minimal Public UI

- [ ] **Step 1: Create `WinnerStoryCard.astro`**

Use a semantic linked article with the existing gold border and quiet motion. The entire card is clickable, while a bottom `Read winner story` row shifts by only a few pixels on hover/focus. Preserve recipient, award, market, and year without hover.

- [ ] **Step 2: Refactor the directory**

Update `src/pages/previous-winners.astro` to use the query module and card component. Add compact GET-based filters and server pagination. Keep the current Hall of Excellence hero and CTA visual language.

- [ ] **Step 3: Create `WinnerStoryArticle.astro`**

Use one wide hero surface and one calm reading column. Render optional facts, quote, recipient profile, related stories, and CTA only when populated. Avoid sidebars, sticky share rails, nested dashboard cards, or decorative clutter.

- [ ] **Step 4: Add resilient image presentation**

For square legacy images, use a wide framed hero with a softly blurred version behind a contained sharp image. Do not crop logos or portraits into unusable widescreen shapes. Future editorial hero images can use full-bleed `object-cover` when marked suitable.

- [ ] **Step 5: Add CSS and motion safeguards**

Add shared prose styles to `global.css`, preserve body weight rules, and disable nonessential transitions under `prefers-reduced-motion`.

- [ ] **Step 6: Verify responsive and keyboard behavior**

Inspect at 1440px, 1024px, 390px, and keyboard-only navigation. Confirm no horizontal scroll, clipped focus rings, content jumps, or hover-only information.

- [ ] **Step 7: Commit public UI**

```bash
git add src/components/WinnerStory* src/pages/previous-winners.astro src/pages/previous-winners/[slug].astro src/styles/global.css
git commit -m "feat: add elegant winner story experience"
```

## Task 7: Expand the Admin Publishing Workflow

- [ ] **Step 1: Expand Zod validation and API errors**

Add explicit URL, text-length, date, rich-text, status-transition, and indexability validation to `winnerInputSchema`. Return `issues.flatten()` with field-specific messages on 422; reserve 409 for real slug conflicts.

- [ ] **Step 2: Add the constrained Tiptap editor**

Create `WinnerStoryEditor.tsx` using StarterKit, Link, and Placeholder only. Include paragraph, H2/H3, lists, bold, italic, quote, undo/redo, and safe links. Do not add tables, arbitrary HTML, font controls, or colors.

- [ ] **Step 3: Refactor `AdminForm.tsx`**

Keep nomination fields unchanged. For winners, add recipient, award, article, media, verification, SEO, and publishing sections. Use existing controls and modal patterns. Add search and social previews, live completeness issues, and a secure preview action.

- [ ] **Step 4: Show quality/indexing state in the manager**

Add `Ready`, `Needs content`, and `Noindex` badges without making the table dense. Provide an ordinary preview link and preserve in-app confirmations.

- [ ] **Step 5: Protect preview and quality endpoints**

Require admin auth, return `Cache-Control: no-store`, and never expose drafts through public detail queries.

- [ ] **Step 6: Test malicious and malformed input**

Cover scripts, event handlers, `javascript:` URLs, invalid dates, oversized bodies, conflicting aliases, and attempts to index incomplete content.

- [ ] **Step 7: Commit admin workflow**

```bash
git add src/components/admin src/lib/admin/content.ts src/pages/api/gbe-admin-safe/winners tests/winners
git commit -m "feat: add winner story editorial workflow"
```

## Task 8: Research, Draft, and Import All 59 Stories

- [ ] **Step 1: Export immutable research inputs**

Run `scripts/export-winner-research.ts` to write each DB ID, recipient, organization, exact award, year, current market, legacy slug, image URL, and source date into one JSON file per award record.

- [ ] **Step 2: Correct obvious source-data defects before writing**

Flag repeated unrelated images, inferred organizations, generic `International` markets, honorifics embedded in names, and duplicate recipients with multiple awards. Do not silently infer corrections without a source.

- [ ] **Step 3: Dispatch research in independent batches**

Use parallel agents with non-overlapping winner files. Each agent must record source URLs, distinguish recipient identity from similarly named entities, and write only claims supported by an official or reputable source. Missing evidence is reported as missing, not invented.

- [ ] **Step 4: Draft one unique article per award win**

Each JSON package includes recipient type, canonical news-style slug, headline, standfirst, structured body, industry, location, official links, image metadata, keyword cluster, SEO title/description, source notes, and fact-check date. Typical length is 700-1,200 useful words when sources support it.

- [ ] **Step 5: Run automated editorial validation**

`scripts/import-winner-stories.ts --check` must reject duplicated paragraphs, duplicate canonical slugs, missing source notes, unsupported index status, malformed URLs, missing alt text, body HTML outside the allowlist, and recipient/award names absent from headline/opening copy.

- [ ] **Step 6: Perform human-style cross-file review**

Search all 59 packages for repeated introductions, generic claims, accidental wrong-company facts, keyword stuffing, and geography conflicts. Verify repeated recipients such as Caravan Fresh and Codezela have award-specific stories rather than near duplicates.

- [ ] **Step 7: Import transactionally**

Run `npm run import:winner-stories -- --check`, then `npm run import:winner-stories`. The script must update by immutable winner ID, preserve images unless a verified replacement is supplied, save old slugs as aliases, and never change nominations.

- [ ] **Step 8: Verify DB results**

Assert 59 published winner records remain, 59 canonical slugs are unique, all have article packages, all old slugs resolve, and only quality-approved records have `indexingStatus = index`.

- [ ] **Step 9: Commit content packages and importer**

```bash
git add content/winner-stories scripts/export-winner-research.ts scripts/import-winner-stories.ts package.json package-lock.json
git commit -m "content: publish verified 2025 winner stories"
```

## Task 9: Add Sharing and Analytics

- [ ] **Step 1: Add unobtrusive share links**

Implement LinkedIn, Facebook, X, WhatsApp, email, and native share where supported. Use encoded canonical URLs and ordinary links as fallback. Do not use browser popup dialogs.

- [ ] **Step 2: Add declarative GA4 events**

Track official-site outbound clicks, shares, related-winner clicks, nomination CTA clicks, and media downloads. Do not send recipient names, emails, or free text as analytics parameters.

- [ ] **Step 3: Verify analytics isolation**

Confirm public story pages include the configured Google tag and admin/auth routes do not.

- [ ] **Step 4: Commit sharing and analytics**

```bash
git add src/components/WinnerShareLinks.astro src/components/GoogleAnalytics.astro src/pages/previous-winners/[slug].astro
git commit -m "feat: add winner story sharing analytics"
```

## Task 10: Harden Imports, Documentation, and Launch Verification

- [ ] **Step 1: Protect editorial content from the live importer**

Change `scripts/import-live-winners.ts` so synchronization updates only source identity fields and media when explicitly configured. It must not overwrite headline, standfirst, body, canonical slug, sources, dates, index status, or human-corrected market/organization values.

- [ ] **Step 2: Update repository documentation**

Document migrations, article research packages, quality checks, import commands, alias behavior, indexing workflow, and the rule that public content remains DB-backed.

- [ ] **Step 3: Run static and unit verification**

```bash
npm run test
npm run build
git diff --check
```

Expected: all tests pass, Astro builds without errors, and no whitespace errors exist.

- [ ] **Step 4: Run runtime verification**

Start `npm run dev` and verify homepage, directory, canonical story, alias redirect, missing story, sitemap, robots, admin login, winner editing, draft preview, and admin analytics exclusion.

- [ ] **Step 5: Run content and media verification**

Verify all 59 canonical pages return 200, old slugs return 301, no unrelated repeated image is presented as verified media, all referenced R2 images return 200, and all indexable pages appear exactly once in the sitemap.

- [ ] **Step 6: Validate representative structured data**

Test at least one person recipient, one organization recipient, one repeated recipient with multiple awards, and one noindex basic record. Confirm JSON-LD parses and mirrors visible content.

- [ ] **Step 7: Inspect final responsive UI**

Capture and inspect desktop and mobile directory/article pages for visual hierarchy, image behavior, typography, spacing, hover/focus states, and reduced motion.

- [ ] **Step 8: Commit final hardening**

```bash
git add README.md AGENTS.md .env.example scripts/import-live-winners.ts tests
git commit -m "chore: harden winner stories for launch"
```

- [ ] **Step 9: Record final evidence**

Report migration status, test/build results, public route counts, sitemap counts, redirect counts, content-quality results, remaining noindex records, and any external-source limitations. Do not claim ranking guarantees or production readiness without this evidence.

