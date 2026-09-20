# 05 Feeds, Sitemap, Robots & Page Metadata

Implementation prompt for adding the statically generated RSS 2.0 feed (`/rss.xml`), Next.js metadata file conventions for `sitemap.xml` (`app/sitemap.ts`) and `robots.txt` (`app/robots.ts`), and comprehensive Metadata API configuration across the root layout, homepage, paginated archive pages, and article pages.

---

## Goal

1. **RSS Feed (`app/rss.xml/route.ts`)**:
   - Statically generated route handler (`export const dynamic = "force-static"`).
   - Valid RSS 2.0 XML with XML declaration and Atom self-link namespace.
   - Channel title, description, and link from `site.config.ts`.
   - Each published post includes `<title>`, `<description>`, `<pubDate>` (RFC 822 format via `toUTCString()`), `<category>` tags, and absolute `<link>` and `<guid isPermaLink="true">`.
   - Sorted newest first (`publishedAt` descending).
   - Drafts strictly excluded.
   - Point header RSS button and footer RSS links to `/rss.xml` (updating `siteConfig.links.rss` from `"/feed.xml"` to `"/rss.xml"`).
   - Add `<link rel="alternate" type="application/rss+xml">` to document `<head>` via Next.js Metadata API in root layout.

2. **Sitemap (`app/sitemap.ts`)**:
   - Statically generated via Next.js metadata file convention (`MetadataRoute.Sitemap`).
   - Lists the homepage (`/`) and every published article (`/articles/[slug]`).
   - `lastModified` set to `updatedAt` or `publishedAt` for articles, and date of latest article for the homepage.
   - Drafts strictly excluded.
   - Absolute URLs built using `process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url`.

3. **Robots (`app/robots.ts`)**:
   - Statically generated via Next.js metadata file convention (`MetadataRoute.Robots`).
   - Allows all search crawlers (`userAgent: "*"`, `allow: "/"`).
   - Specifies absolute sitemap location (`${siteUrl}/sitemap.xml`).

4. **Page Metadata API**:
   - **Root Layout (`app/layout.tsx`)**:
     - `metadataBase` resolved from `process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url`.
     - `title.default`: `siteConfig.name` ("margin").
     - `title.template`: `%s — ${siteConfig.name}`.
     - `description`: `siteConfig.description`.
     - `alternates.types["application/rss+xml"]`: `/rss.xml`.
     - `openGraph`: site name, website type, locale.
   - **Homepage (`app/page.tsx`)**:
     - Descriptive title and site description.
     - Canonical URL (`canonical: "/"`).
   - **Archive Pagination (`app/page/[page]/page.tsx`)**:
     - Title: `Page [n]`.
     - Description for page [n].
     - Canonical URL: `/page/[n]`.
   - **Article Pages (`app/articles/[slug]/page.tsx`)**:
     - Implemented via `generateMetadata({ params })`.
     - `title`: `post.title`.
     - `description`: `post.description`.
     - `alternates.canonical`: `/articles/${post.slug}`.
     - `openGraph`: type `"article"`, title, description, url, publishedTime, modifiedTime (`updatedAt ?? publishedAt`), tags, and author name.
     - `twitter`: card `"summary"`, title, description.
     - Zero Open Graph images generated (as instructed).

5. **Environment Configuration**:
   - Ensure `NEXT_PUBLIC_SITE_URL=https://margin.dev` is committed in `.env.example`.
   - All external/canonical URLs resolve cleanly with a reliable fallback to `siteConfig.url`.

---

## Design Reference & Conventions

- **AGENTS.md Section 7**:
  - Page metadata uses Next.js metadata API: title, description, canonical url, Open Graph tags, and RSS alternate link. Do not generate Open Graph images unless asked.
  - RSS feed lists title, description, date, tags, and absolute link for each published post.
- **AGENTS.md Section 8**:
  - Search index and content models hold no secrets.
  - Required frontmatter: `title`, `description`, `publishedAt`, `tags`. Optional: `updatedAt`, `draft`.
- **AGENTS.md Section 11**:
  - Keep pages static.
  - RSS feed and sitemap require absolute URLs; read site URL from `NEXT_PUBLIC_SITE_URL`. Relative links break in feed readers.
- **Next.js Metadata Conventions**:
  - `app/sitemap.ts` returns `MetadataRoute.Sitemap`.
  - `app/robots.ts` returns `MetadataRoute.Robots`.
  - `app/rss.xml/route.ts` static GET route handler returning XML with `Content-Type: application/xml; charset=utf-8`.

---

## Skills & Code Inspected

- **`node_modules/next/dist/docs/`**:
  - `01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`
  - `01-app/03-api-reference/03-file-conventions/01-metadata/robots.md`
  - `01-app/03-api-reference/03-file-conventions/01-metadata/index.md`
- **`lib/content.ts`**:
  - `getAllPosts({ includeDrafts: false })` guarantees drafts are omitted in feeds and sitemaps.
- **`site.config.ts`**:
  - `siteConfig.name`, `siteConfig.url`, `siteConfig.description`, `siteConfig.author`, `siteConfig.links`.
- **`app/layout.tsx`**:
  - Contains font loading and existing base metadata.
- **`components/site-header.tsx` & `components/site-footer.tsx`**:
  - Both use `siteConfig.links.rss` for the RSS button and links.

---

## Decisions & Assumptions

1. **Static Generation**:
   - `app/rss.xml/route.ts` exports `export const dynamic = "force-static"` so Next.js prerenders it at build time.
   - `app/sitemap.ts` and `app/robots.ts` are statically evaluated at build time.
2. **URL Construction**:
   - Base URL is derived from `process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url`.
   - Trailing slashes are normalized to avoid duplicate slashes (`https://margin.dev/articles/...`).
3. **XML Escaping**:
   - An XML escape helper ensures special characters (`&`, `<`, `>`, `"`, `'`) in post titles, descriptions, and tags are safely encoded.
4. **Draft Filtering**:
   - RSS feed and sitemap explicitly enforce `!p.draft` regardless of environment mode.
5. **No Open Graph Images**:
   - Strictly omitted per user prompt and AGENTS.md instructions.

---

## Files to Touch / Create

- **`site.config.ts`**: Update `links.rss` from `"/feed.xml"` to `"/rss.xml"`.
- **`app/rss.xml/route.ts`** [NEW]: Route handler producing valid RSS 2.0 XML.
- **`app/sitemap.ts`** [NEW]: MetadataRoute sitemap listing `/` and `/articles/[slug]`.
- **`app/robots.ts`** [NEW]: MetadataRoute robots config pointing to `/sitemap.xml`.
- **`app/layout.tsx`**: Add `application/rss+xml` alternate link, OpenGraph defaults, and application name.
- **`app/page.tsx`**: Add `metadata` export with title, description, and canonical URL.
- **`app/page/[page]/page.tsx`**: Update `generateMetadata` to include canonical URL.
- **`app/articles/[slug]/page.tsx`**: Add `generateMetadata` for post title, description, canonical, article OpenGraph tags, and Twitter card tags.
- **`.env.example`**: Verify `NEXT_PUBLIC_SITE_URL` documentation.

---

## Requirements

1. **RSS Feed (`/rss.xml`)**:
   - Statically generated XML route.
   - Compliant RSS 2.0 specification with `xmlns:atom`.
   - Correct channel elements (title, link, description, language, lastBuildDate).
   - Each item has title, description, date, tags (category), and absolute link/guid.
   - Excludes drafts.
2. **Sitemap (`/sitemap.xml`)**:
   - Next.js `sitemap.ts` convention.
   - Lists `/` and all published articles with `lastModified`.
   - Excludes drafts.
3. **Robots (`/robots.txt`)**:
   - Next.js `robots.ts` convention.
   - Allows all user agents and points to absolute sitemap URL.
4. **Metadata API**:
   - Root layout contains `metadataBase`, title template, description, and RSS alternate link.
   - Homepage and archive pages contain canonical URLs.
   - Article page contains OpenGraph article metadata and Twitter card metadata.

---

## Security Considerations

- No secrets exposed; `NEXT_PUBLIC_SITE_URL` is public.
- XML entities properly escaped to avoid XML injection or malformed feed syntax.
- Draft posts never leaked in production feeds, sitemaps, or search indexes.

---

## Acceptance Criteria

- `npm run build` succeeds with static prerendering of `/rss.xml`, `/sitemap.xml`, and `/robots.txt`.
- Navigating to `/rss.xml` returns valid RSS 2.0 XML with `Content-Type: application/xml`.
- Navigating to `/sitemap.xml` lists all published articles and homepage with absolute URLs.
- Navigating to `/robots.txt` outputs proper robots rules and sitemap location.
- Document head of all pages contains `<link rel="alternate" type="application/rss+xml" href="https://margin.dev/rss.xml">`.
- Article pages output OpenGraph `article:published_time`, `article:modified_time`, `article:tag`, and Twitter card tags.
- Header and footer RSS links lead to `/rss.xml`.

---

## Checks to Run

1. `npx tsc --noEmit`: Type checking passes with 0 errors.
2. `npm run lint`: Linting passes with 0 errors.
3. `npm run build`: Production build passes and validates all static routes, including `rss.xml`, `sitemap.xml`, and `robots.txt`.
4. Dev/Prod server validation:
   - Fetch `http://localhost:3000/rss.xml` and verify XML structure and headers.
   - Fetch `http://localhost:3000/sitemap.xml` and verify URLs and lastModified dates.
   - Fetch `http://localhost:3000/robots.txt` and verify rules and sitemap directive.
   - Fetch `http://localhost:3000/articles/type-safe-route-params` and verify metadata tags in HTML `<head>`.

---

## Manual Test Steps

1. Inspect generated RSS feed at `http://localhost:3000/rss.xml`:
   - Confirm valid XML declaration and RSS 2.0 root.
   - Confirm channel metadata matches `site.config.ts`.
   - Verify every article item has absolute link, UTC pubDate, and tags.
2. Inspect sitemap at `http://localhost:3000/sitemap.xml`:
   - Verify presence of `https://margin.dev` and each `/articles/<slug>`.
   - Confirm timestamps match post `publishedAt` / `updatedAt`.
3. Inspect `http://localhost:3000/robots.txt`:
   - Confirm `User-Agent: *`, `Allow: /`, and `Sitemap: https://margin.dev/sitemap.xml`.
4. Inspect HTML source of `http://localhost:3000/`:
   - Confirm canonical `<link rel="canonical" href="https://margin.dev/">`.
   - Confirm RSS alternate `<link rel="alternate" type="application/rss+xml" href="https://margin.dev/rss.xml">`.
5. Inspect HTML source of `http://localhost:3000/articles/type-safe-route-params`:
   - Confirm `<title>` matches format `${post.title} — margin`.
   - Confirm `<meta property="og:type" content="article">`.
   - Confirm `<meta property="article:published_time">` and tags.
   - Confirm `<meta name="twitter:card" content="summary">`.
6. Click RSS button in site header and footer to verify navigation to `/rss.xml`.
