# 07 Launch Prep

Implementation prompt for final launch preparation: auditing and replacing placeholders, setting unpublished nav links to `published: false`, removing the `/dev/components` showcase, removing sample posts and validating the empty archive behavior, adding comprehensive README documentation, performing accessibility and layout passes, and verifying the production build.

---

## Goal

1. **Placeholders Checklist & Config Review**:
   - Audit all placeholder content across `site.config.ts`, `package.json`, `README.md`, metadata, and the favicon.
   - Present the checklist of placeholder fields in `site.config.ts` for user customization:
     - `siteConfig.name` (currently `"margin"`)
     - `siteConfig.url` (currently `"https://margin.dev"`)
     - `siteConfig.description`
     - `siteConfig.author` (name: `"Sam Okafor"`, role, initials: `"SO"`, bio)
     - `siteConfig.links` (github: `"https://github.com/username"`, x: `"https://x.com/username"`, email: `"mailto:hello@margin.dev"`)
     - `siteConfig.tags` (default tag list)
     - `siteConfig.hero` (heading and lead)
     - `siteConfig.now` (role, building, learning, stack, writing)
     - `siteConfig.footer` (copyright)
     - `package.json` (`name`, `version`, `description`)
   - Update `package.json` name to match site name.

2. **Navigation Links**:
   - Set `published: false` in `site.config.ts` for any navigation link (`Projects`, `About`, `Uses`) that does not yet have an implemented page, keeping only `Articles` visible in the site header, mobile menu, and footer.

3. **Remove `/dev/components`**:
   - Delete `app/dev/components/page.tsx` and the `app/dev` folder.
   - Confirm that all shared UI components (`Button`, `Icon`, `Pill`, `Tag`, `Kbd`, `Field`, `CodeBlock`, `PostCard`) remain intact and used by production routes.

4. **Empty Archive Support & Clean Sample Posts**:
   - Remove the sample `.mdx` files from `content/posts/` so the user can start with a fresh archive.
   - Update `components/archive.tsx` to handle an empty archive gracefully:
     - When `totalPostCount === 0`, show a clean empty state: `"No articles published yet. Check back soon for upcoming posts."` without a "Clear filters" button.
     - When `totalPostCount > 0` but a search/filter returns 0 matches, continue showing the filtered empty state: `"No articles found. Try clearing your filters..."` with the "Clear filters" button.
   - Verify that when no posts exist:
     - `Archive` renders 0 post cards and no featured card.
     - `app/page/[page]` generates 0 static pages (`generateStaticParams` returns `[]`).
     - `app/articles/[slug]` generates 0 static pages (`generateStaticParams` returns `[]`).
     - `app/sitemap.ts` returns a valid sitemap containing the homepage.
     - `app/rss.xml/route.ts` returns a valid RSS 2.0 channel with 0 items.
     - `scripts/build-search-index.ts` writes a valid empty array `[]` to `public/search-index.json`.

5. **Favicon & Icons**:
   - Generate a custom SVG-based favicon matching the site brand glyph (`//`) or flag for custom user-provided asset.

6. **Accessibility & Responsive Passes**:
   - Keyboard pass: visible focus rings (`focus-visible:outline-2 focus-visible:outline-accent-text`) across search input, category pills, buttons, links, theme switch, and newsletter inputs.
   - Reduced motion: `prefers-reduced-motion: reduce` respected for smooth scrolling and CSS transitions.
   - Color contrast: maintain tokens from `design/blog-ui-kit.html` in both dark and light modes.
   - Layout audit: zero horizontal overflow (`scrollWidth <= innerWidth`) at 390px (mobile) and 1440px (desktop).

7. **Documentation**:
   - Update `README.md` with:
     - Getting started guide (`npm run dev`, `npm run build`, `npm run start`).
     - Required environment variables (`NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`).
     - Authoring guide: how to create a post in `content/posts/<slug>.mdx` (required/optional frontmatter, tags matching `site.config.ts`, fenced code syntax with titles and line highlights, callout components).

8. **Checks & Verification**:
   - Run `npx tsc --noEmit`.
   - Run `npm run lint`.
   - Run `npm run build` and report the full route table, verifying that only `/api/newsletter` is dynamic.

---

## Decisions & Assumptions

1. **Nav links**: `Projects`, `About`, and `Uses` do not have pages implemented yet (out of scope per AGENTS.md section 1). Setting `published: false` hides them cleanly from the header and footer until the user creates those pages.
2. **Empty archive state**: Distinguish between "no posts in blog yet" (`totalPostCount === 0`) and "no posts matching search query" (`isFiltering`).
3. **Draft post handling**: The content helper and build scripts gracefully handle an empty `content/posts/` directory.

---

## Files to Touch / Delete

- **[DELETE]** `app/dev/components/page.tsx` (and `app/dev/` directory)
- **[DELETE]** `content/posts/*.mdx` (sample posts removed)
- **[MODIFY]** `site.config.ts`: Set `published: false` on `Projects`, `About`, and `Uses`; update placeholders.
- **[MODIFY]** `components/archive.tsx`: Support clean empty archive state when `totalPostCount === 0`.
- **[MODIFY]** `package.json`: Update package name.
- **[MODIFY]** `README.md`: Replace default Next.js template with project documentation.
- **[MODIFY]** `app/favicon.ico`: Provide custom site favicon.

---

## Verification Plan

1. `npx tsc --noEmit` -> 0 errors.
2. `npm run lint` -> 0 errors.
3. `npm run build` -> 0 errors, search index generates cleanly, route table shows `/api/newsletter` as dynamic (`ƒ`) and all other routes static (`○` / `●`).
4. Validate `http://localhost:3000/` renders hero, newsletter, and empty archive state.
5. Validate `http://localhost:3000/rss.xml` and `http://localhost:3000/sitemap.xml` return valid XML.
