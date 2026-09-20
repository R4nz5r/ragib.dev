# 02 Content Pipeline

Implementation prompt for building the MDX content pipeline, frontmatter validation, server content helper, derived post data, server Shiki highlighting, Callout component, search index generation, and sample posts. Data and rendering layer only; no UI pages yet.

---

## Goal

Build a typed, server-only MDX content pipeline that:
1. Validates frontmatter with Zod against `site.config.ts` tags and Section 8 of `AGENTS.md`, failing the build on missing fields, unknown tags, invalid dates, or duplicate slugs with the file name and field.
2. Provides a server content helper returning typed posts (newest first, post by slug, drafts in dev only).
3. Computes derived data: reading time, h2/h3 table of contents synchronized with heading IDs, previous and next post pointers, tag counts, and the featured post.
4. Renders MDX on the server via `next-mdx-remote/rsc` with `remark-gfm`, stable heading IDs (`github-slugger`), and build-time Shiki highlighting supporting code fence meta (`title="..." {line-ranges}`).
5. Provides a Callout MDX component (info and warning, with title).
6. Generates a static build-time search index at `public/search-index.json` (slug, title, description, tags, publishedAt; no bodies).
7. Adds four throwaway sample posts covering code fences, callouts, blockquotes, h2/h3 headings, featured post, and a draft.

---

## Design reference

- `design/blog-ui-kit.html`:
  - Code block styling and structure (lines 257–268 & 1064–1071):
    - Container `.code`, top bar `.code__bar` (height 48px, file name `.code__file span:first-child`, language badge `.lang`, Copy button `.btn--ghost .btn--sm`).
    - Scrolling code pre `.code__pre` with tab size 2 and counter-reset `ln`.
    - Line `.line` with `counter-increment: ln` and non-selectable counter `.line::before` (32px width, user-select none).
    - Highlighted line `.line--hl` (`var(--accent-tint)` fill, `2px` inset line `var(--accent-text)`).
    - Syntax color variables: `--c-kw`, `--c-str`, `--c-fn`, `--c-ty`, `--c-cm`, `--c-num`, `--c-pn`.
  - Callout styling and structure (lines 270–276):
    - Container `.callout` and `.callout--warn`, icon, title `<b>`, content `<div>`.
  - Table of Contents nesting and labels (lines 1103–1108).
  - Sample post copy, tags, and dates (lines 1074–1081).

---

## Technical stack & package selections

1. **`zod`** (v3): Frontmatter validation and schema enforcement.
2. **`gray-matter`**: Frontmatter and raw content parser.
3. **`next-mdx-remote`** (v6, RSC mode `next-mdx-remote/rsc`): Server-rendered MDX pipeline running strictly in React Server Components at build time.
4. **`remark-gfm`** (v4): GitHub Flavored Markdown (tables, autolinks, strikethrough, task lists).
5. **`shiki`** (v4): Server-side syntax highlighting at build time using CSS variable token mapping matching the design tokens (`--c-kw`, `--c-str`, etc.) for zero client bundle overhead and instant dark/light theme switching.
6. **`github-slugger`** (v2): Deterministic heading ID generation shared between the MDX heading processor and the Table of Contents extractor.
7. **`minisearch`** (v7): Client search library added now for subsequent search integration.

---

## Architecture & Implementation Plan

### 1. Frontmatter Validation Schema (`lib/content.ts`)
- Required fields:
  - `title`: `z.string().min(1, "Title is required")`
  - `description`: `z.string().min(1, "Description is required")`
  - `publishedAt`: `z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid ISO date string")`
  - `tags`: `z.array(z.string()).min(1, "At least one tag is required").refine((tags) => tags.every((t) => siteConfig.tags.includes(t as any)), "Contains unknown tag not listed in site.config.ts")`
- Optional fields:
  - `updatedAt`: `z.string().refine((val) => !isNaN(Date.parse(val))).optional()`
  - `featured`: `z.boolean().optional()`
  - `cover`: `z.object({ src: z.string(), alt: z.string() }).optional()`
  - `draft`: `z.boolean().optional()`
- Validation error formatting:
  - When validation fails on any `.mdx` file, throw an Error with format:
    `[Content Validation Error] File: content/posts/<filename>.mdx | Field: <fieldPath> | Reason: <message>`

### 2. Derived Post Data & Server Content Helper (`lib/content.ts`)
- Content directory: `content/posts/`
- Derived data per post:
  - `slug`: filename without `.mdx`.
  - `wordCount`: calculated from markdown body (excluding frontmatter).
  - `readingTime`: derived as `Math.max(1, Math.ceil(wordCount / 200))`.
  - `toc`: Array of `{ id: string; text: string; level: 2 | 3 }` extracted from `## ` and `### ` headings using `github-slugger`.
- Functions exported by `lib/content.ts`:
  - `getAllPosts(options?: { includeDrafts?: boolean }): Promise<Post[]>`
    - Returns posts sorted by `publishedAt` descending (newest first).
    - If `process.env.NODE_ENV === "production"`, drafts are automatically excluded unless explicitly overridden.
    - Validates duplicate slugs across all files.
  - `getPostBySlug(slug: string, options?: { includeDrafts?: boolean }): Promise<Post | null>`
    - Returns full post with raw body and parsed frontmatter.
  - `getAdjacentPosts(slug: string): Promise<{ prev: PostMeta | null; next: PostMeta | null }>`
    - Ordered chronologically by `publishedAt` (skipping drafts in production).
  - `getAllTags(): Promise<{ tag: string; count: number }[]>`
    - Returns derived counts for each tag in `siteConfig.tags`, excluding tags with 0 posts.
  - `getFeaturedPost(): Promise<Post | null>`
    - Returns the post marked `featured: true` (newest if multiple), otherwise the newest published post.

### 3. Heading IDs & Table of Contents (`lib/toc.ts`)
- Parse raw markdown for `## ` (level 2) and `### ` (level 3) headings.
- Use an instance of `GithubSlugger` to slugify each heading text.
- Duplicate heading text automatically receives numerical suffixes (`heading`, `heading-1`, etc.).
- A custom rehype plugin for `next-mdx-remote` uses the same `GithubSlugger` instance for each document so the HTML elements `<h2 id="...">` and `<h3 id="...">` have IDs that match the TOC links exactly.

### 4. Code Blocks & Server Shiki Highlighting (`lib/shiki.ts`, `components/mdx/code-block.tsx`, `components/mdx/copy-button.tsx`)
- Server-side highlighter in `lib/shiki.ts`:
  - Uses `shiki` with a custom CSS-variable theme mapped to:
    - Keywords: `var(--c-kw)`
    - Strings: `var(--c-str)`
    - Functions: `var(--c-fn)`
    - Types: `var(--c-ty)`
    - Comments: `var(--c-cm)`
    - Numbers: `var(--c-num)`
    - Punctuation: `var(--c-pn)`
- Code fence meta parser:
  - Parses language (e.g. `tsx`), title (e.g. `title="app/blog/[slug]/page.tsx"`), and highlighted lines (e.g. `{11-12}` or `{1,3-5}`).
- CodeBlock Server Component:
  - Renders top bar:
    - File title (e.g., `app/blog/[slug]/page.tsx`) or default label.
    - Language badge (e.g., `TSX`).
    - `<CopyButton rawCode={rawCode} />` (small client child component).
  - Pre and code area:
    - Pre with `tabIndex={0}`, class `code__pre`.
    - Code lines rendered as `<span class="line">` or `<span class="line line--hl">`.
    - Line numbers generated via CSS counters (`counter(ln)`) so they are never copied or selectable.

### 5. Callout MDX Component (`components/mdx/callout.tsx`)
- Props: `type?: "info" | "warning"`, `title?: string`, `children: ReactNode`.
- Structure:
  `<aside className={`callout callout--${type}`} role="note">`
  `<Icon name={type === "warning" ? "alert" : "info"} size={20} className="ic" />`
  `<div>{title && <b>{title}</b>}<div>{children}</div></div>`
  `</aside>`
- Uses existing SVG paths from `components/ui/icon.tsx`.

### 6. Build-Time Search Index Generation (`scripts/build-search-index.ts`)
- Script that runs during build (or imported into Next.js build lifecycle).
- Extracts: `slug`, `title`, `description`, `tags`, `publishedAt`.
- Excludes drafts and excludes full article bodies.
- Writes to `public/search-index.json`.

### 7. Four Throwaway Sample Posts (`content/posts/`)
1. `content/posts/type-safe-route-params.mdx`:
   - Code fences with title and line highlights (` ```tsx title="app/blog/[slug]/page.tsx" {11-12} `).
   - Tags: `["Next.js", "TypeScript"]`.
2. `content/posts/server-components-data-boundary.mdx`:
   - Callout component (`<Callout type="info" title="Architecture Note">...</Callout>`).
   - Markdown blockquote (`> ...`).
   - `## ` and `### ` headings.
   - Tags: `["Next.js", "Architecture"]`.
3. `content/posts/designing-css-architecture.mdx`:
   - Marked `featured: true`.
   - Tags: `["CSS Architecture", "Architecture"]`.
4. `content/posts/draft-post.mdx`:
   - Marked `draft: true`.
   - Tags: `["React"]`.

### 8. Verification Script (`scripts/verify-content.ts`)
- Validates all posts.
- Prints derived data for each post (title, reading time, word count, TOC with IDs, prev/next pointers, tag counts, featured post).
- Tests error handling: creates a temporary invalid post (bad tag / bad date / missing title), verifies that validation throws with file name and field, then removes the temporary post.
- Emits and verifies `public/search-index.json`.

---

## Files to touch

| File | Action | Purpose |
|---|---|---|
| `package.json` | Modify | Add `next-mdx-remote`, `gray-matter`, `zod`, `remark-gfm`, `shiki`, `github-slugger`, `minisearch` |
| `content/posts/type-safe-route-params.mdx` | New | Sample post with code fences and highlighted lines |
| `content/posts/server-components-data-boundary.mdx` | New | Sample post with Callout, blockquote, headings |
| `content/posts/designing-css-architecture.mdx` | New | Sample post marked featured |
| `content/posts/draft-post.mdx` | New | Sample post marked draft |
| `lib/content.ts` | New | Server content helper, Zod schema validation, derived properties |
| `lib/toc.ts` | New | Table of contents & heading ID extraction with `github-slugger` |
| `lib/shiki.ts` | New | Server Shiki highlighter and code fence meta parser |
| `components/mdx/callout.tsx` | New | Callout MDX component |
| `components/mdx/copy-button.tsx` | New | Client Copy button for code blocks |
| `components/mdx/code-block.tsx` | New | Server code block component |
| `components/mdx/mdx-content.tsx` | New | Server component evaluating MDX via `next-mdx-remote/rsc` |
| `app/globals.css` | Modify | Ensure `.code`, `.code__bar`, `.code__file`, `.code__pre`, `.line`, `.line--hl`, `.callout` styles from design kit are present |
| `scripts/build-search-index.ts` | New | Script to build `public/search-index.json` |
| `scripts/verify-content.ts` | New | Verification script printing derived data and testing error conditions |

---

## Acceptance Criteria

1. Frontmatter validation with Zod throws descriptive errors naming file and field when a required field is missing, a tag is not in `site.config.ts`, a date is invalid, or a duplicate slug is found.
2. `getAllPosts()` returns posts ordered newest first by `publishedAt`.
3. Draft posts appear in dev mode (`process.env.NODE_ENV !== "production"`) and are excluded in production.
4. Reading time is derived as `Math.max(1, Math.ceil(words / 200))`.
5. Table of contents derives `h2` and `h3` with identical IDs to rendered HTML headings, correctly handling duplicate heading suffixes.
6. Fenced code blocks parse title, language, and line highlight ranges, rendering the top bar, line numbers via CSS counters, and a working Copy button.
7. Shiki runs strictly on the server at build time.
8. Callout MDX component renders info and warning variants with title.
9. `public/search-index.json` contains `slug`, `title`, `description`, `tags`, `publishedAt` without article bodies or drafts.
10. `npx tsx scripts/verify-content.ts` runs cleanly and reports verified derived data.
11. Production build (`npm run build`) succeeds with 0 errors and 0 warnings.
