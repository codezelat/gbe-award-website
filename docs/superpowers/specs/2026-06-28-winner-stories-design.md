# Winner Stories Design

## Purpose

Turn every previous-winner card into a permanent, editorial-quality winner story that acts as both the official award record and a useful search landing page. The feature must preserve the existing GBE visual language, remain fast and server-rendered, support future winners through the admin CMS, and avoid duplicate or fabricated content.

The primary search intent is the intersection of:

- the recipient's exact public name;
- the exact award title and category;
- Global Business Excellence Awards and GBE Awards;
- the verified market or country, where it is genuinely relevant;
- the award year.

No implementation can guarantee a number-one ranking. The system should maximize eligibility, clarity, authority, internal discovery, and backlink potential while following Google Search guidelines.

## Product Decision

Each award win has one canonical **Winner Story**. It is both the official winner record and the editorial announcement. The site must not publish a second blog article containing substantially the same content.

A future News or Insights index may include ceremony reports, interviews, nomination announcements, and industry analysis. Those articles link to Winner Stories. They do not duplicate them.

## URL Model

Canonical detail URLs use a flat, news-style slug beneath the existing collection:

```text
/previous-winners/hiru-tv-wins-most-popular-television-channel-2025
```

The route does not contain a separate year directory. New slugs are generated from recipient, award title, and year so the same recipient can win more than once without collisions.

Existing imported short slugs and legacy WordPress winner URLs must permanently redirect to the canonical Winner Story. Slugs already published as canonical are immutable by default. If an administrator changes one, the previous value is retained as a redirect alias.

## Public Experience

### Winners Directory

The existing `/previous-winners` page remains the Hall of Excellence directory. Each card becomes a real link with:

- a subtle whole-card hover and keyboard-focus treatment;
- a compact `Read winner story` affordance that appears without covering content;
- recipient, award, market, and year remaining visible without interaction;
- no heavy client-side animation or hydration requirement.

The directory supports crawlable year, market, and category filtering. Filtering must remain usable without JavaScript. Pagination is server-rendered when required, and every indexable detail page is reachable through ordinary HTML links.

### Winner Story Layout

The article is deliberately quiet, spacious, and editorial. It uses the existing dark surface, restrained gold accents, Tajawal typography, rounded cards, and shared page shell. It must not become a dashboard, a dense magazine grid, or a collection of decorative boxes.

The reading column is approximately 720-820px wide. The hero may be wider than the prose, with a maximum page width consistent with `container-gbe`.

Page order:

1. Compact breadcrumbs.
2. Award label, market, and publication date.
3. Natural editorial H1.
4. Standfirst of roughly 30-60 words.
5. Large responsive hero image with optional caption and credit.
6. Minimal award-facts panel for recipient, award, year, market, ceremony date, and location when verified.
7. Server-rendered article body.
8. Optional winner quote.
9. About the recipient and verified official link.
10. Short reusable context about GBE Awards and London Business Consultancy.
11. Three or four related winners selected by category, market, or year.
12. Restrained nomination/application CTA.

Optional sections are omitted cleanly when data is absent. Empty headings, placeholder prose, fake quotes, and invented judging rationale are prohibited.

### Loading and Accessibility

- Article HTML is rendered on the server and does not require React hydration.
- The hero image has explicit dimensions and responsive `srcset` variants.
- The hero is loaded eagerly only when it is the LCP candidate; related images are lazy-loaded.
- Images use descriptive, truthful alt text. Decorative marks use empty alt text.
- Cards and controls have visible keyboard focus, correct landmarks, and reduced-motion support.
- Share actions use ordinary links or the Web Share API with a non-popup fallback.

## Content Model

The existing `past_winners` record remains the source of truth. It gains fields grouped as follows.

### Recipient Identity

- `recipientType`: `person` or `organization`
- `recipientName`
- `organization`
- `industry`
- `location`
- `officialWebsiteUrl`
- `linkedinUrl`
- `facebookUrl`
- `instagramUrl`

### Award Record

- `awardTitle`
- `category`
- `year`
- `market`
- `ceremonyDate`
- `ceremonyLocation`
- `awardCitation`

### Editorial Story

- `headline`
- `standfirst`
- `summary` for cards and listings
- `body` as sanitized structured rich-text blocks
- `achievementHighlights`
- `quoteText`
- `quoteAuthor`
- `quoteAuthorRole`
- `heroImageUrl`
- `heroImageAlt`
- `heroImageCaption`
- `heroImageCredit`
- `authorName`
- `publishedAt`
- `contentUpdatedAt`

### Search and Publishing

- `slug`
- `slugAliases`
- `seoTitle`
- `seoDescription`
- `socialImageUrl`
- `indexingStatus`: `noindex` or `index`
- `status`: existing draft, published, or archived lifecycle
- `sourceNotes`: private source URLs and verification notes
- `factCheckedAt`

Structured rich text permits only paragraphs, H2/H3 headings, ordered and unordered lists, block quotes, emphasis, and safe links. It must be validated and sanitized on input and output.

## Editorial Standard

Every article must be written from verified evidence. Sources may include the legacy GBE record, official recipient website, verified social profiles, reputable press coverage, nomination materials supplied to GBE, and approved winner statements.

The 59 imported records currently contain only an award heading, image, and generated one-sentence summary. Those facts are not sufficient to fabricate a long article. Each legacy story therefore passes through research, drafting, fact checking, and publishing.

The target is generally 700-1,200 useful words when evidence supports that depth. Shorter, complete articles are preferable to padded content. Articles do not need identical headings or length.

Each story should naturally cover:

- what was awarded and when;
- who the recipient is;
- verified work, achievements, or impact relevant to the recognition;
- the award's market context;
- why the recognition matters, without unsupported claims;
- useful official links and related GBE records.

Location terms such as Sri Lanka, United Kingdom, London, or International are used only when accurate. Keyword stuffing, hidden text, copied company boilerplate, invented quotations, fake judges' comments, and unsupported `best`, `leading`, or `number one` claims are prohibited.

## Per-Story Search Strategy

The primary keyword cluster is generated from factual fields rather than manually stuffing a keywords meta tag:

```text
{recipient name} + {award title}
{recipient name} + Global Business Excellence Awards
{recipient name} + GBE Awards {year}
{award title} + {verified market}
```

The H1 is a readable announcement, for example:

```text
Hiru TV named Most Popular Television Channel of the Year at the Global Business Excellence Awards 2025
```

The SEO title may use a shorter form when necessary. The exact recipient and award names appear naturally in the title, standfirst, opening paragraph, facts panel, image context, internal anchor text, and structured data. Synonyms are used only where natural.

The system does not rely on `meta keywords`, which modern Google Search does not use for ranking.

## Indexing Quality Gate

All 59 records can have working public detail pages, but a page is indexable only when it passes the editorial gate:

- unique headline and standfirst;
- verified award identity;
- meaningful, original body content;
- appropriate recipient type and official links where available;
- representative image with truthful alt text;
- valid publication date and author;
- complete canonical, metadata, and structured data;
- private source notes and fact-check timestamp;
- no placeholders or duplicated template paragraphs.

Pages that do not pass remain `noindex,follow`, stay out of the sitemap, and may still be opened from the directory as an official basic record. Publishing and indexing are separate controls.

## SEO and Structured Data

Each indexable story emits one consistent JSON-LD graph:

- `WebPage` with `primaryImageOfPage`;
- `Article` for evergreen or migrated stories;
- `NewsArticle` only for genuinely timely new announcements;
- `Person` or `Organization` for the recipient;
- the recipient's `award` property as the official award-title text;
- the relevant annual GBE `Event` when verified;
- `BreadcrumbList`;
- GBE Awards as publisher, with London Business Consultancy represented accurately as parent organizer.

Article metadata includes `headline`, `description`, representative image variants, `datePublished`, meaningful `dateModified`, `author`, `publisher`, `mainEntityOfPage`, and `about` references. Structured data must describe content visible on the page.

The existing generic `Thing` with an `additionalType` pretending to be an Award is replaced.

Open Graph and social-card metadata use the story's hero or dedicated social image. The shared public `SeoHead` remains the single injection path. Admin and auth routes remain noindex and analytics-free.

## Sitemap, Discovery, and Redirects

The generated XML sitemap includes only canonical, indexable, published stories. It uses accurate `lastmod` values from meaningful content changes and includes image metadata where applicable. Static pages remain included. Unsupported ranking signals such as sitemap priority are not emphasized.

Robots.txt continues pointing to the generated sitemap. Winner Story URLs are linked from:

- the Hall of Excellence directory;
- relevant year and category views;
- homepage winner features when added;
- related-winner modules;
- future News and Insights content.

Legacy WordPress URLs and old imported slugs receive HTTP 301 redirects. Missing, archived, and malformed slugs return correct 404 behavior and never resolve to an unrelated winner.

## Admin Experience

The existing winner form becomes a focused multi-section editor using the current admin modal, controls, toast system, and dark visual language.

It provides:

- a compact rich-text block editor;
- automatic news-style slug suggestion with manual override;
- image upload, alt text, caption, and credit controls;
- recipient and award fields;
- SEO preview for desktop and mobile search snippets;
- social-card preview;
- article completeness checklist;
- separate `Publish` and `Allow indexing` controls;
- duplicate slug and alias validation;
- preview link for drafts using a secure admin-only preview mechanism;
- inline validation and in-app confirmation dialogs only.

The API validates URL protocols, text lengths, allowed rich-text nodes, publication dates, indexing rules, and status transitions. It returns field-specific errors rather than generic failures.

## Publicity and Authority

Each published winner receives a share panel with:

- canonical Winner Story URL;
- LinkedIn, Facebook, X, WhatsApp, email, and native share actions;
- downloadable winner badge or media asset;
- optional embeddable badge code linking to the canonical story;
- suggested press and social copy generated from approved article fields.

This supports genuine external links from recipient sites, profiles, and press coverage. Backlinks and independent mentions are expected to be more influential for broad recipient-name searches than adding repetitive on-page keywords.

## Analytics

Public GA4 tracking adds privacy-conscious events for:

- winner story view;
- official website outbound click;
- share action;
- related winner click;
- nomination CTA click;
- badge or media-kit download.

No user-identifying winner data is sent as custom analytics data. Admin and auth surfaces remain excluded.

## Data Migration and Legacy Articles

Migration must be additive and safe:

1. Add nullable fields and new supporting tables or JSON columns.
2. Backfill news-style canonical slugs while preserving current slugs as aliases.
3. Preserve all 59 images, names, awards, markets, and source dates.
4. Create public basic-record pages as `noindex,follow`.
5. Research and draft each story from captured sources.
6. Fact-check and publish indexing in controlled batches.
7. Verify redirect coverage before domain launch.

The live import script must never overwrite human-edited article content during a later synchronization. Imported source fields and editorial fields are updated independently.

## Edge Cases

- One person associated with an organization.
- An organization rather than a person receives the award.
- The same recipient wins multiple awards or years.
- Two recipients have identical or similar names.
- A winner has no official website or social profile.
- No suitable hero image exists.
- Images fail or are removed from R2.
- Ceremony date or location is unknown.
- A quote or award citation is unavailable.
- A slug is changed after publication.
- A winner is archived after being indexed.
- A draft is accidentally requested through its public URL.
- Database or media services are temporarily unavailable.
- Legacy import runs again after editorial enrichment.

Every optional-content case degrades by omission, not placeholder text. Published pages use truthful fallbacks and correct HTTP/cache behavior.

## Verification

Implementation is complete only after:

- schema migration and rollback safety are reviewed;
- all API validation and authorization paths are tested;
- listing cards, detail pages, aliases, 404s, and draft access are tested;
- rich-text sanitization is tested against malicious input;
- sitemap and robots behavior are tested against index status;
- JSON-LD passes automated parsing and Google Rich Results validation where applicable;
- responsive desktop and mobile layouts are visually inspected;
- keyboard navigation and reduced motion are checked;
- representative image URLs are publicly crawlable;
- build passes with zero errors;
- production-like runtime checks confirm DB rendering and cache behavior;
- all 59 records remain present and no existing media is lost.

## Out of Scope for This Build

- A general-purpose blogging platform unrelated to awards.
- Automatically generated factual claims or quotes.
- Paid-link schemes or guarantees of a particular search ranking.
- Public nominee detail pages unless designed and approved separately.

