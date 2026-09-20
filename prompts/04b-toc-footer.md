# 04b Table of Contents & Post Footer

Implementation prompt for adding the Table of Contents (desktop sticky sidebar and mobile disclosure) and the post footer (share links, previous/next article cards, and newsletter block) to the article page at `/articles/[slug]`.

---

## Goal

1. **Table of Contents Component (`components/table-of-contents.tsx`)**:
   - Built directly from `post.toc` (the `h2` and `h3` list already produced by the content helper, no re-parsing).
   - **Desktop**:
     - Sticky sidebar in columns 10 to 12 (`.at-10.c-3.toc-wrap`) with `top: 96px` offset.
     - "On this page" label (`.toc__t`).
     - Indented h3 headings (`.is-sub`).
     - Active item indicator (`aria-current="true"` with accent left border and accent text) tracked via `IntersectionObserver`.
     - Read progress bar (`.toc__prog`, `.toc__bar`, `[data-pct]`) showing live scroll progress percentage.
     - Clicking an item scrolls smoothly to its heading using `scrollIntoView` (or instant jump if `prefers-reduced-motion: reduce`).
     - Heading `scroll-margin-top: 88px` ensures the 64px sticky site header never covers headings when jumped to.
   - **Mobile**:
     - Collapsible disclosure (`details.toc-m`) above the article (`.c-8.prose`), collapsed by default.
     - Rotating chevron icon on open/close (`.toc-m[open] summary .ic { transform: rotate(180deg); }`).
     - Same items and click-to-scroll behavior, closing the disclosure upon selection.
2. **Post Footer**:
   - **Share Row (`components/share-row.tsx`)**:
     - Rendered within the 8-column width (`.c-8 .share`).
     - Copy link button with a 2-second "Copied" feedback state and check icon.
     - Plain share links for Post on X (`https://x.com/intent/tweet`), LinkedIn, and Email (`mailto:`).
   - **Previous and Next Article Cards (`components/article-nav.tsx`)**:
     - Ordered by `publishedAt` via `getAdjacentPosts(slug)`.
     - When both exist: 6 columns each (`.c-6.navcard`).
     - When only one exists: renders only that one in its dedicated column (`.c-6` for previous, `.at-7.c-6` for next).
     - Hover states: 2px lift, accent border, title in accent text.
   - **Newsletter Block**:
     - Reuses `NewsletterForm` with live states (`submitting`, `success` with `.is-done` confirmation note, `error`).
     - Styled in 2-column layout (`.news` with `.news__c` on left and `.signup` on right).

---

## Design Reference

From `design/blog-ui-kit.html`:
- **Desktop Table of Contents** (lines 963–973, 360–371):
  - Container `.toc-wrap` with `.toc`: `position: sticky; top: 96px; display: flex; flex-direction: column; gap: 16px;`.
  - Title: `.toc__t` (font 600 14px/24px).
  - List: `.toc__list` (border-left 1px solid var(--border)), links with `padding: 8px 16px; margin-left: -1px; border-left: 2px solid transparent;`.
  - Sub-items: `.toc__list a.is-sub` with `padding-left: 32px; font-weight: 400;`.
  - Active item: `aria-current="true"` sets `color: var(--accent-text); border-left-color: var(--accent-text);`.
  - Progress bar: `.toc__bar` (height 4px, background `var(--surface-3)`), indicator `i` with `background: var(--accent-text); border-radius: 999px;`.
- **Mobile Table of Contents** (lines 928–931, 372–375, 466):
  - `.toc-m`: `display: none;` on desktop, `display: block;` on mobile (≤720px).
  - `summary`: height 48px, padding 0 16px, font 600 14px/24px, flex space-between.
  - Chevron rotation: `.toc-m[open] summary .ic { transform: rotate(180deg); }`.
- **Share Row** (lines 978–987, 377–378, 473–474):
  - Desktop: flex space-between, top border, 48px margin-top.
  - Mobile: `.share__b` becomes a 2-column grid (`grid-template-columns: 1fr 1fr`).
- **Previous/Next Navcards** (lines 990–993, 379–386, 475–477):
  - `.navcards`: 48px top margin (32px on mobile).
  - `.navcard`: padding 24px, radius 12px, border 1px solid var(--border), background `var(--surface)`.
  - `.navcard--next`: text-align right, `.navcard__d` aligned right (collapses to left on mobile).
- **Article Newsletter Section** (lines 995–1007, 387–392, 478–479):
  - Desktop: `.news` 2-column grid (`repeat(2, minmax(0, 1fr))`), 48px margin-top, padding 48px.
  - Mobile: single column, 24px gap and padding.

---

## Skills & Code Inspected

- **AGENTS.md**:
  - Section 5: Small client leaves for interactive pieces; Table of Contents scroll tracking.
  - Section 7: TOC derived from h2 and h3; sticky sidebar on desktop, disclosure on mobile; share links are plain links plus copy button; newsletter route has not configured state.
  - Section 11: `position: sticky` stops working if any ancestor has `overflow: hidden` or `auto`. Keep overflow off page containers; line numbers non-selectable.
  - Section 12: Reduced motion respected.
- **Existing Code**:
  - `lib/content.ts`: `getAdjacentPosts(slug)` returns typed `{ prev, next }`.
  - `lib/toc.ts`: `extractToc()` produces `{ id, text, level }[]`.
  - `components/newsletter-form.tsx`: client component supporting `hideLabel` and live states.
  - `site.config.ts`: `siteConfig.url` and site social links.

---

## Decisions & Assumptions

1. **Client / Server Boundary**:
   - `app/articles/[slug]/page.tsx` remains a 100% static Server Component.
   - `TableOfContents` is a client component receiving `items: TocItem[]`.
   - `ShareRow` is a client component receiving `title: string` and `slug: string` to handle the interactive copy link state.
   - `ArticleNav` and the `.news` newsletter container are rendered on the server, with `NewsletterForm` at the leaf.
2. **Scroll Tracking & Progress Calculation**:
   - Headings are observed via an `IntersectionObserver`. As headings cross the top third of the viewport, the corresponding TOC link is set to `aria-current="true"`.
   - Live scroll event listener calculates reading progress based on scroll position relative to the article container, updating the progress bar width and percentage text.
3. **Scroll Margins & Smooth Scrolling**:
   - CSS `h2[id], h3[id] { scroll-margin-top: 88px; }` guarantees that scrolling into view leaves comfortable clearance below the 64px sticky site header.
   - Smooth scrolling is bypassed if `window.matchMedia("(prefers-reduced-motion: reduce)").matches` is true.
4. **Single Adjacent Post Column Alignment**:
   - When only `prev` exists, it renders in columns 1–6 (`.c-6`).
   - When only `next` exists, it renders in columns 7–12 (`.at-7.c-6`) to preserve right-aligned layout integrity.

---

## Files to Touch / Create

1. **`app/globals.css`** (MODIFY):
   - Add TOC styles: `.toc`, `.toc__t`, `.toc__list`, `.toc__list a`, `.toc__list a.is-sub`, `.toc__prog`, `.toc__bar`, `.toc-m`.
   - Add post footer styles: `.share`, `.share__b`, `.navcards`, `.navcard`, `.navcard--next`, `.navcard__d`, `.news`, `.news__c`.
   - Add `scroll-margin-top: 88px` for heading IDs.
   - Add mobile overrides for `.share`, `.share__b`, `.navcards`, `.navcard--next`, `.news`, `.toc-m`.
2. **`components/newsletter-form.tsx`** (MODIFY):
   - Add optional `hideLabel?: boolean` and `defaultNote?: string` props for reuse in the article footer.
3. **`components/table-of-contents.tsx`** (NEW):
   - Client component managing active heading observation, progress bar tracking, smooth scrolling, and mobile disclosure.
4. **`components/share-row.tsx`** (NEW):
   - Client component rendering Copy link with 2s copied state and plain links for X, LinkedIn, Email.
5. **`components/article-nav.tsx`** (NEW):
   - Renders previous and next post navigation cards with dedicated column classes.
6. **`app/articles/[slug]/page.tsx`** (MODIFY):
   - Pass `post.toc` to `<TableOfContents />`.
   - Render post footer below article: `<ShareRow />`, `<ArticleNav />`, and `<section className="news">`.

---

## Security & Architectural Constraints

- No external analytics, share SDKs, or third-party tracking scripts.
- Pure static generation (`● (SSG)`).
- Zero overflow on page wrappers to ensure sticky sidebar functionality.
- Accessible ARIA attributes (`aria-current="true"`, `aria-label="Table of contents"`, `aria-label="Breadcrumb"`).

---

## Acceptance Criteria

- `npx tsc --noEmit` exits with 0 errors.
- `npm run lint` exits with 0 errors.
- `npm run build` succeeds with all pages pre-rendered statically.
- On desktop: TOC sticks in columns 10–12 at 96px offset, highlights active heading on scroll, and updates reading progress percentage.
- Clicking any TOC item smoothly scrolls to the heading with 88px clearance above it.
- On mobile: TOC collapses into `<details class="toc-m">` above the article, rotating chevron on open.
- Share buttons: "Copy link" copies article URL and shows "Copied" for 2 seconds; X, LinkedIn, Email links open valid intent/mailto URLs.
- Previous/Next cards render when posts exist, correctly positioned in dedicated columns.
- Article newsletter form operates with full submit/success/error states.

---

## Manual Test Steps

1. Start dev server (`npm run dev`) and open `http://localhost:3000/articles/type-safe-route-params`.
2. Verify Desktop Table of Contents:
   - Sticky sidebar in columns 10–12 with "On this page" label.
   - Sub-headings ("Wrap the parse in a helper", "Search params") indented.
   - Scroll down: active item indicator moves between headings and progress bar fills.
   - Click "Search params": smooth scrolls to heading without header obstruction.
3. Verify Post Footer:
   - Click "Copy link": changes to "Copied" with checkmark for 2 seconds.
   - Inspect X, LinkedIn, and Email links: verify valid query URLs.
   - Verify Previous and Next cards: click "Previous article" and navigate to older post.
   - Test newsletter form at bottom of post: enter email and submit, verify confirmation note.
4. Open first published article (`/articles/react-compiler-patterns`):
   - Verify only "Next article" is rendered, aligned in columns 7–12.
5. Open newest published article (`/articles/designing-css-architecture`):
   - Verify only "Previous article" is rendered, aligned in columns 1–6.
6. Switch browser to 390px mobile view:
   - Verify desktop TOC is hidden.
   - Verify `<details class="toc-m">` disclosure appears above the article.
   - Tap "On this page": confirm disclosure expands with rotating chevron.
   - Tap an item: confirm page scrolls to heading and disclosure closes.
   - Verify share buttons form a 2-column grid.
   - Verify Previous/Next cards stack vertically.
   - Verify newsletter block stacks into a single column.
