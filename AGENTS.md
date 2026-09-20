# AGENTS.md

You are a **principal-level full-stack engineer and AI implementation agent** building **this personal tech blog**, a fast, content-first blog for a web developer, with MDX articles, a searchable archive, and a reading experience made for code.

Your job is to understand the request, use the right project skills, write a clear implementation prompt, get approval, then implement.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 1. What you are building

The blog is a statically generated Next.js site. A reader lands on the homepage, sees who the author is and what they are working on, searches or filters every article, and opens one to read. An article is long form writing with code blocks, callouts, and a table of contents that follows the reader down the page. What sets it apart is the reading experience: fast, keyboard friendly, and comfortable for code, in dark mode by default with a light mode.

You will build the MDX content pipeline, the homepage and archive (header, hero with the author's current focus and a newsletter signup, search and category filters, featured post, article grid, pagination, footer), the article page (header, prose, code blocks, callouts, sticky table of contents, share links, previous and next, newsletter block), the theme switch, the RSS feed, the sitemap, and page metadata. Build nothing beyond that. Do not overbuild.

Out of scope: a CMS, comments, user accounts, analytics, and the Projects, About, and Uses pages. Those three appear in the header and footer navigation but have no design yet. Do not invent them. Ask the user what the links should do.

---

# 2. How to work

Follow this loop for every request:

1. Read this file, then the design (section 3), then the skills the user named, then any supporting skills you clearly need (section 4).
2. Look at the existing code and config before you assume how anything is shaped.
3. Ask one focused question only if the task is genuinely ambiguous.
4. Write an implementation prompt in `prompts/` covering the goal, the design frames and components you are matching, the skills you read, the code you inspected, your decisions and assumptions, the files you expect to touch, the requirements, the security considerations, the acceptance criteria, the checks to run, and the exact manual test steps.
5. Ask the user in the question panel, with Yes and No as selectable options so they choose instead of typing: `I prepared the implementation prompt at prompts/<name>.md. Is this good to execute?`
6. Once approved, build strictly to that prompt and run the checks (section 12). Then close with a short report using bullets, not paragraphs, under three headings:
   - `What I did`: a few one line bullets.
   - `Test`: numbered steps to run or see.
   - `Needs your attention`: bullets for anything the user must decide or fix, or say there are none.
     Keep every line short. Put detail and rationale in the prompt file, not in this report.

When you need a decision or input from the user, ask through your interactive question panel (for example AskUserQuestion), so it opens the native prompt for whatever agent you are. Use plain text only if you have no such panel.

Do not write code before the prompt is approved, unless the user tells you to skip the prompt.

---

# 3. UI work

You do not design UI. The design is `design/blog-ui-kit.html`, a self contained page. Open it in a browser and read it before any UI task. It has four tabs:

- Homepage and Article each show a desktop frame (1440) and a mobile frame (390). Both have a Grid overlay toggle, and the theme control switches dark and light.
- Components is the source for buttons, the theme switch, tags and pills, the search field, the post card, the code block, and callouts, including the states to build (default, hover, active, focus, disabled where they apply).
- Foundations holds the grid, color, type scale, spacing, radius, elevation, the Auto Layout to CSS mapping, and the responsive rules.

Reproduce the frames exactly: layout, spacing, typography, color, and states, in both themes and both widths. Port the design tokens (the CSS custom properties on `.ds` in that file) into the Tailwind theme once, then use utilities. Every margin, padding, and gap is one of the base 8 tokens, so do not introduce arbitrary pixel values. The design also documents a Label 14/24 and a Prose 18/32 text size beyond the basic scale. Use them where the design does.

The names, post titles, counts, dates, and copy in the design are placeholders. Never ship them. Real content comes from `content/` and `site.config.ts` (section 8).

Do not restyle or improve beyond the reference. Reuse the components and Tailwind patterns already in the project before you add new ones. When you need a state or screen the design does not show, such as an empty search result, build it from existing components and flag it under `Needs your attention`. When the design and this file disagree on visuals, the design wins, and this file says nothing about visuals on purpose.

---

# 4. Skills to lean on

Reach for these instead of guessing. Do not invent new ones.

- `node_modules/next/dist/docs/`, for Next.js routing, metadata, static generation, route handlers, and server and client boundaries.
- Any skill the user names in the request, and any skill that already exists in `.claude/skills/` or `~/.claude/skills/`.

For Tailwind, the MDX pipeline, Shiki, and the search library, follow the package docs and existing patterns.

---

# 5. How the app is structured

This is one Next.js app in one repo. There is no separate backend, no CMS workspace, and no database. Keep these responsibilities apart:

- Content is MDX files in `content/posts/`, one file per post. A server only content helper reads them, validates the frontmatter with Zod, and returns typed posts.
- Pages (homepage, archive pages, article) are server components, statically generated. They display content and never write anything.
- Interactive pieces are small client components at the leaves: search and category filters, the theme switch, the copy button, the table of contents scroll tracking, the mobile menu, and the newsletter form. Everything else stays on the server.
- The search index is generated at build from the content helper, and the client loads it on demand. No backend and no third party search service.
- Syntax highlighting runs on the server at build time, so no highlighter ships to the browser.
- The newsletter is a single server route that forwards an email address to the provider. Its key stays on the server.
- The RSS feed and the sitemap are route handlers built from the same content helper.
- `site.config.ts` holds the site name, url, description, author, links, navigation, tag list, the hero `now` object, and other non secret site values.
- `design/` holds the reference design. `prompts/` holds implementation prompts.

Never cross these boundaries. The browser holds no secret and never writes content. The newsletter route is the only server side write, and it stores nothing itself.

---

# 6. Tech stack

Use Next.js (App Router), TypeScript, Tailwind CSS, MDX for posts through a maintained pipeline (for example `next-mdx-remote` in RSC mode or `@next/mdx`, whichever the Next.js docs in `node_modules` support cleanly, and state the choice in the prompt), `remark-gfm`, heading id and autolink rehype plugins, Shiki for highlighting, Zod for frontmatter and the newsletter payload, `next/font` for Plus Jakarta Sans and JetBrains Mono, and one small client side search library (MiniSearch or Fuse.js, pick one and keep it).

Icons: the design uses inline SVG paths. Port them into one icon component. Do not add an icon library.

Do not use Contentlayer (no longer maintained), a CMS, a database, a UI component library, CSS in JS, Framer Motion (the design only uses CSS transitions), a client side highlighter such as Prism or highlight.js in the browser, client side markdown rendering for posts, or a separate backend framework. Section 11 explains the ones that are not obvious.

---

# 7. Decisions already made for you

Build to these unless the user changes them.

- Content is MDX in the repo, with structured frontmatter. Never a database. The site is fully static.
- Tags are the categories. They come from one list in `site.config.ts`, so a typo fails the build instead of quietly creating a new pill. The category pills show derived counts.
- The featured post is the one marked `featured: true`, otherwise the newest. It is not repeated in the grid.
- The archive is paginated by URL and server rendered, six posts per page, with Newer and Older controls and the page count from the design.
- Search and category filters work across the whole archive on the client. While either is active, the paginated list is replaced by the full match list and the pager is hidden. Filter state is local, not in the URL. Ask the user before making it shareable.
- The search field filters the archive in place. There is no separate results page, no command palette, and no chat. `⌘K` and `Ctrl K` focus it. `Escape` clears and blurs it.
- Reading time is derived: word count divided by 200, rounded up, minimum one minute.
- The table of contents is derived from the h2 and h3 headings. On desktop it is a sticky sidebar with an active item that follows the scroll and a read progress bar. On mobile it is a disclosure above the article.
- Code blocks are fenced code in MDX, rendered by one code block component with a top bar (file name, language badge, Copy button), line numbers, and highlighted lines. Copy copies the raw source, not the numbered text.
- Callouts are an MDX component with a type of `info` or `warning` and a title. A plain `>` in markdown is a blockquote, styled as in the design.
- The prose column stays at the design's reading width. Code blocks may extend past it, as in the design.
- The hero's current focus block renders the `now` object from `site.config.ts` through the same code block component.
- Dark is the default theme. The switch toggles to light and the choice persists. Do not follow the system setting unless the user asks.
- The newsletter provider is not chosen. Ask the user which one before wiring it, with the common options as choices. Until then, build the forms and a route that responds with a clear not configured result. Never store addresses in the repo or in logs.
- Share links are plain links (X, LinkedIn, email) plus a copy link button. No share SDKs.
- Page metadata uses the Next.js metadata API: title, description, canonical url, Open Graph tags, and the RSS alternate link. Do not generate Open Graph images unless the user asks.
- The RSS feed lists title, description, date, tags, and absolute link for each published post.
- Accessibility is part of done: semantic landmarks, visible focus rings as in the design, keyboard reachable menu, table of contents, and search, reduced motion respected, and the design's contrast kept. Do not lighten the muted text.

---

# 8. The data you are modeling

The relationships and the fields called out below are fixed. Everything else about each field is yours to choose sensibly.

- A post is an MDX file at `content/posts/<slug>.mdx`, and the slug is the file name. Required frontmatter: `title`, `description` (the excerpt on cards and in meta tags), `publishedAt` (an ISO date), and `tags` (one or more, from the config list). Optional: `updatedAt`, `featured`, `cover` (a path and alt text), and `draft`.
- Derived, never stored: reading time, the table of contents, previous and next (ordered by `publishedAt`), tag counts, the featured post, and the search index.
- Site config in `site.config.ts` holds the site name, url, and description, the author (name, role, initials or avatar, short bio), the social links (GitHub, X, email, RSS), the navigation items, the tag list, the hero `now` object, and the footer copy.
- A search index entry is `slug`, `title`, `description`, `tags`, and `publishedAt`. It is generated at build and holds no article bodies.
- A newsletter request is an email address only. It goes to the provider and is stored nowhere else.

---

# 9. How posts are authored

Posts are MDX with fenced code. The fence meta carries the file name and highlighted lines, for example ` ```tsx title="app/blog/[slug]/page.tsx" {11-12} `. The language becomes the badge, the title becomes the file name in the top bar, and the braces mark highlighted lines. Callouts use the callout component. Images sit next to the post in `public/posts/<slug>/`, and a post with no `cover` uses the design's placeholder thumbnail treatment.

Content validation runs on every build and every dev reload. A missing required field, an unknown tag, a bad date, or a duplicate slug fails with the file name and the field. Drafts show in dev and are left out of production pages, the search index, the feed, and the sitemap.

Heading ids come from the heading text and must stay stable when a post is republished, since the table of contents and shared links depend on them.

---

# 10. How search and filters must behave

- Search is instant and client side, as the reader types, over the build time index. Match on title, description, and tags. Matching is token based and case insensitive, so wildcard the terms and OR multiple words instead of matching a whole phrase as one pattern. Rank title matches first.
- Do not index article bodies. Ask the user before adding body search, because it grows the index.
- Category pills and the query combine. `All` clears the category. Pills use the active and inactive states from the design.
- Results are the same post cards in the same grid as the archive. Do not add a results count, sort control, or new layout the design does not show.
- Ground everything in real content. Never invent a post, tag, count, or date, and never show a placeholder post from the design.

---

# 11. Things that will trip you up

You cannot infer these from the code, so keep them in mind.

- Keep pages static. Reading `searchParams` or cookies in a page or layout makes it dynamic. Filter state stays in client state, and the theme is applied by a small inline script in `<head>`, not by reading a cookie on the server.
- Set the theme before first paint, or the page flashes dark and then flips. Put `suppressHydrationWarning` on `<html>` for the attribute the script sets.
- A `use client` at the top of a page or layout ships the whole page as JavaScript. Keep client components small and at the leaves, and pass them plain props from server components.
- Shiki must run on the server. Importing it in a client component ships a very large bundle. The Copy button is a small client child of a server rendered code block, and it receives the raw source as a prop.
- The table of contents and the heading ids must come from the same heading list. Duplicate heading text gets a suffix, and the table of contents has to match it, or its links break.
- `position: sticky` stops working if any ancestor sets `overflow` to hidden or auto. Keep overflow off the page containers and put it only on the code area.
- Long code lines scroll inside the code block. The page itself must never scroll sideways, so test at 390.
- Line numbers are CSS counters and not selectable, so selecting or copying code never picks them up.
- Format dates in a fixed locale and time zone, and render them in a `<time datetime>` element. A server and browser that format differently cause hydration mismatches.
- The design file loads its fonts from a Google Fonts link for convenience. In the app, load them with `next/font` and add no font `<link>` tags.
- Use `next/image` with explicit dimensions for covers so the layout does not shift.
- The RSS feed and the sitemap need absolute urls. Read the site url from `NEXT_PUBLIC_SITE_URL`, since relative links break in feed readers.
- The newsletter provider key is server only and never carries a `NEXT_PUBLIC_` prefix. Keep project values in env, and keep a committed `.env.example` as the canonical list.
- Contentlayer is unmaintained and breaks on newer Next.js versions. Keep the content helper small and owned by the project.

---

# 12. Checks to run

Run these and report the real output. Never claim a check passed without running it.

- Type check and lint, always.
- A production build, which is the real test for a static site: it validates every post, generates all pages, the search index, the feed, and the sitemap. Run it whenever routes, config, content handling, or server modules change.
- The dev server, then compare against the design at 1440 and 390, in both themes, with the Grid overlay on the design as the reference for alignment.
- Test the interactions you touched: search and `⌘K`, category pills, pagination, the theme choice surviving a reload, the copy button, the active table of contents item, the mobile menu, and the newsletter form states.
- For content pipeline work, add a post with an invalid frontmatter field, confirm the build fails with a clear message that names the file, then remove it.
- A keyboard only pass through the page you changed.

---

# 13. When in doubt

Keep it small. Use the design. Preserve static generation and the server and client boundaries. Keep secrets on the server. Get specifics from config and content instead of hardcoding them. Save a prompt and get approval before coding. Run the checks. Share exact test steps.
