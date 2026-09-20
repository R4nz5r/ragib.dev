# 04a Article Page

Implementation prompt for building the article page at `/articles/[slug]`, including static generation, article header, prose styling matching the design at desktop (1440px) and mobile (390px), server-rendered code blocks in the wide slot, callouts, and minimal treatments for unmodeled markdown elements.

---

## Goal

1. **Static Routing (`/articles/[slug]`)**:
   - Statically generated via `generateStaticParams()` from `getAllPosts()`.
   - Unknown slugs trigger `notFound()` (HTTP 404) and remain statically prerendered.
   - Draft posts return 404 in production (`isProd && !includeDrafts`) and render in development.
2. **Article Header**:
   - Header spanning 9 columns (`.c-9.art__head`):
     - Breadcrumb navigation: `Articles` linking to `/`, first tag linking to `/`, current article title marked with `aria-current="page"` and `.cut` (which collapses on mobile).
     - Category tags list (`.card__tags`).
     - Metadata row: published date (`<time>`), updated date (rendered conditionally only when `updatedAt` is present), and derived reading time.
     - Article H1 heading (`.t-h1`).
     - Author card from `siteConfig.author`: 48px avatar (`.avatar.avatar--48`), author name (`<b>`), author role (`<span>`), Follow on X button (`.btn--collapse`, label hides on mobile), and GitHub icon button.
3. **Prose Styling**:
   - Article body in 8 columns (`.c-8.prose`):
     - Heading 2 (`.prose h2`), Heading 3 (`.prose h3`) with stable deterministic IDs from `rehypeHeadingIds` (no anchor icons).
     - Paragraphs (`font: 400 18px/32px var(--font-ui)`, mobile: `16px/24px`).
     - Links (`color: var(--accent-text)` with underline and hover to text).
     - Unordered lists (`.prose ul`) with accent bullet dots (`6px` circles in `var(--accent-text)`).
     - Blockquotes (`<blockquote>`) with 2px accent left border (`var(--accent-text)`), `20px/28px` typography.
     - Inline code (mono 14px, `var(--surface-2)` background, `var(--border)` border).
     - Reading width: child elements restricted to `max-width: 680px`, while code blocks with `.wide` expand to fill the full 8-column container.
4. **Callouts**:
   - `Callout` component with `info` (violet accent) and `warning` (amber) types, icon, bold title, and body.
5. **Code Blocks in Wide Slot**:
   - Fenced code blocks rendered by `CodeBlock` inside `.wide` containers spanning the full 8-column width.
6. **Layout & Reserved Slot**:
   - Container: `.wrap.grid12`.
   - Header in 9 columns (`.c-9`).
   - Prose in 8 columns (`.c-8`).
   - Empty reserved slot in columns 10 to 12 (`.at-10.toc-wrap`, hidden on mobile) for the sticky Table of Contents in step 04b.
   - Strict avoidance of `overflow: hidden` or `overflow: auto` on page containers so that `position: sticky` will work reliably.
7. **Unmodeled Markdown Elements**:
   - Minimal styling using existing design tokens for `img`, `table`, `ol`, and `hr`.

---

## Design Reference

From `design/blog-ui-kit.html`:
- **Article Header** (lines 901–925):
  - `.art__head`: padding 48px 0 24px (mobile: 32px 0 16px).
  - `.crumbs`: flex, gap 8px, font 500 14px/24px var(--font-ui), color var(--text-3).
  - `.crumbs span.cut`: hidden on mobile (≤720px) to prevent breadcrumb wrapping.
  - `.author`: border-block 1px solid var(--border), padding 16px 0, avatar 48px, author action buttons aligned right.
  - `.author .btn--collapse`: on mobile, width collapses to 32px and `.lbl` is hidden (`display: none`).
- **Prose & Typography** (lines 345–359 & 467–471):
  - Desktop: `.prose` 18px/32px, h2 32px/40px (margin-top 48px), h3 24px/32px (margin-top 32px), lead paragraph 20px/32px.
  - Mobile: `.prose` 16px/24px, h2 24px/32px (margin-top 32px), h3 20px/28px (margin-top 24px), blockquote 20px/28px padding-left 16px.
  - Bullet lists: custom 6px circular dot `background: var(--accent-text)`.
  - Inline code: font-mono 14px, surface-2 background, 1px border.
  - Layout width: `.prose > * { max-width: 680px; }`, `.prose > .wide { max-width: none; }`.
- **Callout** (lines 270–276, 752–762):
  - Info: background `var(--info-bg)`, border `var(--info-line)`, icon `var(--info-ic)` (`#i-info`).
  - Warning: background `var(--warn-bg)`, border `var(--warn-line)`, icon `var(--warn-ic)` (`#i-alert`).
  - Padding 16px 24px, radius 8px, title 600 bold.

---

## Skills & Code Inspected

- **AGENTS.md**:
  - Section 5: Articles are statically generated server components.
  - Section 6: MDX pipeline through `next-mdx-remote` in RSC mode, `remark-gfm`, Shiki on the server.
  - Section 7: Code blocks in MDX, callouts with `info` or `warning`, no heading anchor icons, prose column at reading width, code blocks extend past it.
  - Section 8: Post data model (`slug`, `title`, `description`, `publishedAt`, `updatedAt`, `tags`, `cover`, `content`).
  - Section 11: Overflow off page containers for sticky TOC; long code lines scroll inside code block; format dates with fixed timezone (`timeZone: "UTC"`).
- **Existing Code**:
  - `lib/content.ts`: `getAllPosts()`, `getPostBySlug()`.
  - `lib/date.ts`: `formatDate()` with fixed UTC timezone.
  - `components/mdx/mdx-content.tsx`: `MDXRemote` with `Callout`, `CodeBlock`, `remarkGfm`, `rehypeHeadingIds`.
  - `components/mdx/callout.tsx`: already supports `type` and `title`.
  - `components/mdx/code-block.tsx`: server-rendered Shiki with CopyButton.

---

## Decisions & Assumptions

1. **Static Generation & 404 Handling**:
   - `generateStaticParams()` returns `{ slug: post.slug }` for all published posts.
   - `getPostBySlug(slug)` finds the matching post. If `null`, calls Next.js `notFound()`.
   - In production, drafts are excluded by `getAllPosts()`, automatically returning 404 for draft slugs while rendering in development.
2. **Wide Slot for Code Blocks**:
   - In `components/mdx/mdx-content.tsx`, fenced code blocks in `pre` are wrapped in `<div className="wide">...</div>`, allowing `.prose > .wide { max-width: none; }` to expand code blocks to the full 8 columns while paragraphs, lists, and headings remain constrained to 680px.
3. **No Anchor Icons**:
   - Headings receive stable IDs (`id="slug"`) via `rehypeHeadingIds` for TOC anchor linking, but no `#` link icons are added to heading text per AGENTS.md.
4. **Reserved TOC Slot**:
   - `<aside className="at-10 c-3 toc-wrap" aria-label="Table of contents" data-slot="toc" />` is rendered in columns 10 to 12 (span 3), hidden on mobile via `.toc-wrap { display: none; }`.
5. **Unmodeled Elements**:
   - Minimal styling using existing tokens will be added for `img`, `table`, `ol`, and `hr` and flagged under `Needs your attention`.

---

## Files to Touch / Create

1. **`app/globals.css`** (MODIFY):
   - Add `.art__head`, `.crumbs`, `.crumbs a`, `.crumbs [aria-current]`, `.art__meta`, `.author`, `.author__act`, `.art__grid`.
   - Add `.prose` rules: `> *`, `> .wide`, `> * + *`, `h2`, `h3`, `p.lead`, `a`, `ul`, `ul li`, `ul li::before`, `code:not(pre code)`.
   - Add minimal treatment for unmodeled elements (`img`, `table`, `ol`, `hr`).
   - Add mobile overrides (`.art__head`, `.crumbs span.cut`, `.author`, `.author .btn--collapse`, `.toc-wrap`, `.prose`, `.callout`).
2. **`components/mdx/mdx-content.tsx`** (MODIFY):
   - Ensure fenced code blocks are wrapped in `<div className="wide">` with `className="my-0"`.
3. **`app/articles/[slug]/page.tsx`** (NEW):
   - Server Component with `generateStaticParams()`.
   - Header with breadcrumbs, tags, published date, updated date (conditional), reading time, H1, and author card.
   - 8-column `<article className="c-8 prose">` with `<MDXContent source={post.content} />`.
   - 3-column reserved slot `<aside className="at-10 c-3 toc-wrap" data-slot="toc" />`.

---

## Security & Architectural Constraints

- Server Component only. No client state or client hooks at the page level.
- Shiki syntax highlighting runs exclusively on the server at build time.
- Page and container elements have no `overflow: hidden` or `overflow: auto`.
- Zero external CSS libraries or frameworks.

---

## Acceptance Criteria

- `npx tsc --noEmit` exits with 0 errors.
- `npm run lint` exits with 0 errors.
- `npm run build` succeeds, pre-rendering all 8 article pages statically (`● /articles/[slug]`).
- Visiting `/articles/type-safe-route-params` renders the header, breadcrumbs, tags, dates, author card, styled prose, callout, and code block.
- Visiting an unknown slug (e.g. `/articles/unknown-post`) renders the 404 page.
- At 390px mobile viewport: breadcrumb title collapses, author button collapses to icon-only, code block scrolls internally without horizontal page overflow.

---

## Manual Test Steps

1. Start the dev server (`npm run dev`) and open `http://localhost:3000/articles/type-safe-route-params`.
2. Verify article header:
   - Breadcrumb: "Articles" (links to `/`), "Next.js", and article title.
   - Tags: "Next.js" and "TypeScript".
   - Published date formatted consistently (e.g. "Sep 12, 2026"), reading time ("11 min read").
   - H1 heading.
   - Author card: avatar "SO", "Sam Okafor", "Full-stack developer", "Follow on X" button, GitHub icon button.
3. Verify prose styling:
   - H2 and H3 headings.
   - Lead paragraph.
   - Code block inside wide container stretching across the 8-column width.
   - Copy button inside code block works.
   - Callouts render with icons and titles.
   - Bullet list with accent dots.
4. Open `http://localhost:3000/articles/designing-css-architecture`:
   - Verify blockquote renders with 2px accent bar.
5. Open an invalid slug `http://localhost:3000/articles/non-existent-slug`:
   - Verify standard 404 page is displayed.
6. Switch browser to 390px mobile view:
   - Verify breadcrumb title is hidden to avoid wrapping.
   - Verify author Follow button collapses to icon-only (32px square).
   - Verify prose adapts typography size.
   - Verify page has no horizontal scroll.
