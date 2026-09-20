# 03b Archive Under the Hero

Implementation prompt for building the searchable, category-filtered, paginated article archive under the homepage hero, along with the PostCard component, URL-based static pagination, and `/dev/components` showcase.

---

## Goal

1. **PostCard Component**: Build a reusable post card matching `design/blog-ui-kit.html`:
   - Grid layout: 16:9 thumbnail (image or placeholder with dot grid and monospace glyph), category tags, title (`h3.card__title`), excerpt (`p.card__ex`), and bottom meta bar (calendar date and clock read time).
   - Featured layout: horizontal 50/50 split on desktop, stacked on mobile, `h2.card__title`, active "Featured" tag, author row (avatar, author name, role, "Read article" button).
   - Hover states: 2px lift (`transform: translateY(-2px)`), accent border, surface-2 background, soft shadow, title changes to accent text.
   - Links to `/articles/<slug>` (expected 404 until the article page is built).
2. **Archive Header & Filter Bar**:
   - Section heading: `h2.t-h2` "Latest articles", `span.t-meta` "{total} posts".
   - Search field: search icon, placeholder "Search articles", `<Kbd>⌘K</Kbd>` shortcut badge.
   - Category pills: "All" plus each tag from `siteConfig.tags` with derived counts.
   - Instant client-side search over the build-time index using MiniSearch: token-based, case-insensitive, prefix wildcarding, title matches boosted first.
   - Keyboard navigation: `⌘K` and `Ctrl+K` focus the search input; `Escape` clears filters and blurs.
   - Category and query combine.
3. **Featured Card & 6-per-page Article Grid**:
   - Page 1 shows the featured card above the grid.
   - Featured post is excluded from the grid so it does not repeat.
   - Article grid renders up to 6 posts per page in a 12-column grid (`.c-4` per card).
4. **URL-based Static Pagination**:
   - `/` is page 1; `/page/[n]` (e.g. `/page/2`) is statically generated via `generateStaticParams`.
   - Pager at the bottom: Newer button, `Page X of Y` caption, Older button.
   - Featured card is only rendered on page 1.
   - Disabled states when on the first or last page.
5. **Active Filter Overrides & Empty State**:
   - When a search query or a category pill is active, the featured card and pager are hidden, and all matching posts are displayed in the grid.
   - If no posts match, render a plain empty state built from existing components with a "Clear filters" button.
6. **Component Showcase (`/dev/components`)**:
   - Add the Post card section showing Default and Hover (`forcedState="hover"`) states side by side with the specification table.

---

## Design Reference

From `design/blog-ui-kit.html`:
- **Archive Section Markup** (lines 877–898):
  - `.sec`: padding-top 48px (mobile: 32px).
  - `.sec-head`: display flex, align baseline, justify space-between, gap 16px, margin-bottom 24px.
  - `.filters.grid12`: `.field.c-4` and `.pills.c-8`.
  - `.feature [data-slot="feature"]`: margin-top 32px.
  - `.grid12.posts [data-slot="posts"]`: margin-top 24px, row-gap 24px.
  - `.pager`: display flex, align center, justify space-between, gap 16px, margin-top 32px.
- **Card CSS** (lines 235–255):
  - `.card`: flex column, background `var(--surface)`, border `1px solid var(--border)`, border-radius 12px, overflow hidden.
  - `.card:hover, .card.is-hover`: border `var(--accent-line)`, background `var(--surface-2)`, `transform: translateY(-2px)`, shadow `var(--shadow-hover)`.
  - `.card__title`: 24px/32px font-ui, weight 600, letter-spacing -0.01em, 3-line clamp.
  - `.card--feature`: flex-row, 50% thumbnail on left, 32px/40px title, 4-line clamp, author row with avatar and outline button.
- **Thumbnail CSS** (lines 230–234):
  - `.thumb`: 16:9 aspect ratio, radial-gradient dot pattern (`radial-gradient(var(--border-strong) 1px, transparent 1px)` with 16px size), border-bottom 1px solid var(--border).
  - `.thumb__g`: monospace glyph with accent text and surface-2 background.
  - `.thumb__l`: 13px/18px monospace "1200 x 675" in bottom-right corner.
- **Mobile Overrides (≤720px)** (lines 445–454):
  - `.filters .kbd`: hidden.
  - `.pills`: `flex-wrap: nowrap`, `overflow-x: auto`, negative margin offset for edge-to-edge scrolling with hidden scrollbar.
  - `.card--feature`: flex column, 16:9 thumbnail on top, button hidden in author row.

---

## Skills & Code Inspected

- **AGENTS.md**:
  - Section 5: Static pages, small client leaves, build-time search index loaded on demand.
  - Section 7: Six posts per page, featured post not repeated, URL pagination, client search and category filters, title matches first, reading time derived, no CMS or database.
  - Section 8: Post schema and search index structure.
  - Section 10: Instant client-side search, token-based, case-insensitive, OR multiple terms, category pills combine.
  - Section 11: Static pages (no dynamic cookies/headers), fixed timezone for dates (`timeZone: "UTC"`).
- **Existing Files**:
  - `lib/content.ts`: `getAllPosts`, `getFeaturedPost`, `getTagCounts`, `generateSearchIndex`, `writeSearchIndex`.
  - `components/ui/button.tsx`, `field.tsx`, `kbd.tsx`, `pill.tsx`, `tag.tsx`, `icon.tsx`.
  - `package.json`: `minisearch` is installed.

---

## Decisions & Assumptions

1. **Content & Pagination**:
   To test multi-page static pagination (`/` and `/page/2`) with 6 posts per page and a featured card, we will create 5 additional high-quality MDX posts in `content/posts/` covering the topics from `siteConfig.tags` (Architecture, TypeScript, CSS Architecture, Next.js, React, Performance). With 8 published posts total:
   - 1 featured post (`designing-css-architecture`).
   - 7 grid posts: Page 1 displays 6 posts, Page 2 displays 1 post (`totalPages = 2`).
   - `generateStaticParams` exports `/page/2`.
2. **Search Index & MiniSearch**:
   - `SearchIndexEntry` in `lib/content.ts` will include `readingTime` and `cover` so that client search results render full post cards without re-fetching individual posts.
   - MiniSearch is configured with fields `title`, `description`, `tags` and boosted title matches (`title: 3`, `tags: 2`, `description: 1`) with prefix matching enabled.
3. **Empty State**:
   - When no articles match an active query or category filter, display a clean empty state card inside the grid with an icon, message, and a "Clear filters" `Button`.
4. **Client/Server Split**:
   - `app/page.tsx` and `app/page/[page]/page.tsx` are static Server Components.
   - `components/archive.tsx` is the interactive client component at the leaf handling local search/filter state, keyboard shortcuts, and rendering the matching cards.
5. **Date Formatting**:
   - Consistent `timeZone: "UTC"` date formatting helper in `lib/date.ts` to prevent SSR hydration mismatches.

---

## Files to Touch / Create

1. **`lib/date.ts`** (NEW):
   - Export `formatDate(dateString: string): string` with fixed `en-US` and `timeZone: "UTC"`.
2. **`lib/content.ts`** (MODIFY):
   - Update `SearchIndexEntry` to include `readingTime` and `cover`.
   - Update `generateSearchIndex()` to populate these fields.
3. **`content/posts/*.mdx`** (NEW):
   - `discriminated-unions-boolean-flags.mdx` (TypeScript)
   - `container-queries-design-system.mdx` (CSS Architecture)
   - `ports-and-adapters-nextjs.mdx` (Architecture, Next.js)
   - `naming-things-design-tokens.mdx` (CSS Architecture)
   - `react-compiler-patterns.mdx` (React, Performance)
4. **`scripts/build-search-index.ts`** (VERIFY/RUN):
   - Generate updated `public/search-index.json`.
5. **`app/globals.css`** (MODIFY):
   - Add `.sec`, `.sec-head`, `.filters`, `.pills`, `.feature`, `.posts`, `.pager`, `.card`, `.thumb`, `.avatar`, and mobile overrides.
6. **`components/post-card.tsx`** (NEW):
   - Renders standard grid post card or featured card layout.
   - Supports `forcedState="hover"` for showcase.
   - Handles placeholder thumbnail dot grid and monospace glyph, or `next/image` when cover is provided.
7. **`components/archive.tsx`** (NEW):
   - Client component managing search query, category selection, MiniSearch execution, empty state, and keyboard shortcuts (`⌘K`, `Ctrl+K`, `Escape`).
8. **`app/page.tsx`** (MODIFY):
   - Load published posts, featured post, and tag counts on the server.
   - Pass Page 1 data into `<Archive />`.
9. **`app/page/[page]/page.tsx`** (NEW):
   - Implement `generateStaticParams()` for paginated archive pages.
   - Render `<Hero />` and `<Archive />` with Page N data (no featured card).
10. **`app/dev/components/page.tsx`** (MODIFY):
    - Add Post card section showcasing Default and Hover states side by side.

---

## Security & Architectural Constraints

- Fully static site (`○ (Static)`). No dynamic route switches, cookies, or `searchParams`.
- Filter state is strictly local client state.
- No backend search requests; MiniSearch indexes the build-time JSON payload.
- Zero client-side syntax highlighting or external icons.

---

## Acceptance Criteria

- `npx tsc --noEmit` exits with 0 errors.
- `npm run lint` exits with 0 errors.
- `npm run build` succeeds and statically pre-renders `/` and `/page/2`.
- Section header displays correct post count.
- Filter bar allows typing search queries and toggling category pills with derived counts.
- `⌘K` / `Ctrl+K` focuses the search field; `Escape` clears and blurs.
- Featured card displays on Page 1 only; absent on `/page/2` and during active search/filter.
- Pager operates statically between `/` and `/page/2`.
- Empty state appears when a search query produces no results, offering "Clear filters".
- `/dev/components` displays PostCard in default and hover states.

---

## Manual Test Steps

1. Start dev server with `npm run dev` and navigate to `http://localhost:3000`.
2. Verify "Latest articles" section header shows "8 posts".
3. Verify the featured post is displayed prominently at the top of the archive.
4. Verify 6 post cards appear in the grid below the featured post, each with thumbnail glyph, tags, title, excerpt, date, and read time.
5. Verify the pager shows "Newer" (disabled), "Page 1 of 2", and "Older" (enabled linking to `/page/2`).
6. Click "Older" to navigate to `/page/2`:
   - Confirm featured card is NOT present.
   - Confirm 1 remaining post is rendered in the grid.
   - Confirm pager shows "Newer" (linking to `/`), "Page 2 of 2", and "Older" (disabled).
7. Return to `/` and test category pills:
   - Click "TypeScript": verify grid updates to show only TypeScript posts, featured card and pager hide.
   - Click "All": verify full paginated view and featured card return.
8. Test search field:
   - Press `⌘K` or `Ctrl+K`: verify search input is focused.
   - Type "route": verify `Type-safe route params in the App Router` appears at the top.
   - Press `Escape`: verify field clears and blurs, returning to standard view.
   - Type an unmatched query like "xyz123": verify empty state appears with "Clear filters" button. Click "Clear filters" and verify archive restores.
9. Resize browser to mobile (390px):
   - Confirm pills scroll horizontally with scrollbar hidden.
   - Confirm featured card stacks vertically into single column.
   - Confirm grid cards stack cleanly with no horizontal page scroll.
10. Navigate to `http://localhost:3000/dev/components`:
    - Confirm Post card section renders Default and Hover states side by side.
