# 09 CLI Blog Post Scaffolder (`npm run new-post`)

Implementation prompt for adding an interactive and argument-driven CLI script (`scripts/new-post.ts` and `npm run new-post`) that scaffolds new `.mdx` blog posts into `content/posts/` with valid frontmatter, automatic slugification, date formatting, tag validation against `site.config.ts`, and boilerplate structure.

---

## Goal

1. **Add `scripts/new-post.ts`**:
   - Provide a zero-dependency CLI tool (executed via existing `tsx`) that quickly generates new MDX posts.
   - Support both command-line arguments (e.g. `npm run new-post "Mastering Next.js Server Components"`) and an interactive terminal prompt (using Node's built-in `node:readline/promises`) when run without arguments.
   - Automatically convert titles into kebab-case slugs for the filename (`content/posts/<slug>.mdx`).
   - Guarantee valid frontmatter adhering to `PostFrontmatterSchema` in `lib/content.ts`:
     - `title`: string
     - `description`: string
     - `publishedAt`: ISO date string (`YYYY-MM-DD`)
     - `tags`: valid tag(s) strictly drawn from `siteConfig.tags` in `site.config.ts`
     - `featured`: boolean
     - `draft`: boolean (default `false` or promptable)
   - Guard against accidental file overwrites if a post with the same slug already exists.
   - Populate starter MDX body with clean markdown headings, a sample `<Callout>`, and a fenced code block with title and syntax highlighting.

2. **Register NPM Script**:
   - Add `"new-post": "tsx scripts/new-post.ts"` to `scripts` in `package.json`.

---

## Design Reference & Component States

- The generated template matches the component specifications of the blog:
  - H2 (`##`) and H3 (`###`) headings for the sticky Table of Contents.
  - Fenced code block with `title="..."` and `{...}` highlighting matching the server-side Shiki component.
  - `<Callout type="info" title="...">` component matching the design kit callouts.

---

## Skills & Code Inspected

- **AGENTS.md Section 5**:
  - Content is MDX files in `content/posts/`, one file per post.
  - Content helper reads them and validates frontmatter with Zod.
- **AGENTS.md Section 8**:
  - Required frontmatter: `title`, `description`, `publishedAt`, `tags` (one or more, from config list).
  - Optional: `updatedAt`, `featured`, `cover`, `draft`.
- **AGENTS.md Section 9**:
  - Heading ids come from heading text.
  - Fenced code with metadata (`title`, highlights).
- **Code Inspected**:
  - `site.config.ts`: `tags: ["TypeScript", "Next.js", "CSS Architecture", "Architecture", "React", "Performance"]`.
  - `lib/content.ts`: `PostFrontmatterSchema` Zod validation.
  - `package.json`: existing scripts and `tsx` dependency.

---

## Decisions & Assumptions

- Zero new npm dependencies: use standard Node.js built-ins (`node:fs`, `node:path`, `node:readline/promises`) executed by `tsx`.
- Fallback gracefully: if a user runs `npm run new-post "My Title"`, it creates the post immediately with sensible defaults (today's date, default tag `TypeScript`, clean slug) without blocking. If run with no arguments (`npm run new-post`), it launches an interactive questionnaire.
- If a post file already exists at `content/posts/<slug>.mdx`, the script aborts with an error rather than silently overwriting work.

---

## Files to Touch

| File | Operation | Description |
| --- | --- | --- |
| `scripts/new-post.ts` | New | CLI post generator script supporting arguments and interactive mode |
| `package.json` | Modify | Add `"new-post": "tsx scripts/new-post.ts"` to `scripts` |

---

## Requirements

1. **CLI Execution**:
   - `npm run new-post "My New Post Title"` creates `content/posts/my-new-post-title.mdx`.
   - `npm run new-post` prompts for Title, Description, Tags (numbered list of allowed tags), and Featured status.
2. **Validation**:
   - Tags must only be members of `siteConfig.tags`.
   - Date must be formatted as `YYYY-MM-DD`.
   - Slug must be URL-safe (lowercase alphanumeric separated by single hyphens).
3. **Template Content**:
   - Clean frontmatter.
   - Introductory paragraph.
   - Section with `##` heading.
   - Code snippet example with language and filename.
   - Callout example.

---

## Security Considerations

- File writes are restricted to `content/posts/` and cannot traverse outside the workspace directory.

---

## Acceptance Criteria

- [ ] Running `npm run new-post "Test Article"` creates a valid `.mdx` file in `content/posts/`.
- [ ] Running `npx tsx scripts/verify-content.ts` or `npm run build` passes with zero Zod validation errors on the generated post.
- [ ] Running `npm run lint` and `npx tsc --noEmit` pass with zero errors.
- [ ] The generated post renders correctly in the blog archive and article page at `http://localhost:3000`.

---

## Checks to Run

1. `npm run new-post "Building Fast Web Apps with Next.js"`
2. `npx tsc --noEmit`
3. `npm run lint`
4. `npm run build`

---

## Manual Test Steps

1. Run `npm run new-post "Building Fast Web Apps with Next.js"`.
2. Inspect the created file in `content/posts/building-fast-web-apps-with-nextjs.mdx`.
3. Open `http://localhost:3000` and confirm the new post appears in the archive grid and hero featured slot.
4. Click on the post to open `/articles/building-fast-web-apps-with-nextjs` and verify headings, code block, callout, and table of contents.
