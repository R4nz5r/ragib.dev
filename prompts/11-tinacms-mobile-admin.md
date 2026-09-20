# 11 TinaCMS Git-Backed Admin for Mobile & Desktop Publishing

Implementation prompt for integrating TinaCMS into the blog, adding a visual `/admin` dashboard that supports creating posts and uploading photos from both mobile phones and desktop browsers, while committing directly to GitHub as MDX and maintaining 100% static generation speed.

---

## Goal

1. **Mobile-Friendly Visual Admin (`/admin`)**:
   - Provide a browser-based dashboard accessible from desktop and mobile browsers (`http://localhost:3000/admin` locally and `https://ragib.dev/admin` in production).
   - Allow creating, editing, and publishing blog articles without opening a terminal or code editor.
   - Support image uploads directly from a mobile device (camera or photo library) and desktop (drag-and-drop).

2. **Preserve Static Generation & Zero-Friction Reader Performance**:
   - The blog remains 100% statically generated with Next.js App Router.
   - Content continues to be stored as version-controlled `.mdx` files in `content/posts/`.
   - Visitors continue to receive instantaneous (~30–50ms) page loads from the edge CDN.

3. **Align Schema with Existing Frontmatter**:
   - Configure Tina schema to match `PostFrontmatterSchema` in `lib/content.ts` and `site.config.ts`:
     - `title` (required string)
     - `description` (required string, textarea)
     - `publishedAt` (required datetime)
     - `updatedAt` (optional datetime)
     - `tags` (multiselect matching `siteConfig.tags`: TypeScript, Next.js, CSS Architecture, Architecture, React, Performance)
     - `featured` (boolean)
     - `cover` (image)
     - `draft` (boolean)
     - `body` (rich-text with MDX component templates including `Callout`)

---

## Architecture & How It Works

```
[Mobile Phone / Desktop Browser]
       │
       ▼
[https://ragib.dev/admin] (TinaCMS SPA)
       │
       ▼
[Tina Cloud API] (Free tier: 2 users, commits to GitHub)
       │
       ▼
[GitHub Repository] (Creates commit with .mdx & image in public/posts)
       │
       ▼
[Vercel Build] (Rebuilds 100% static HTML & updates search index)
       │
       ▼
[Visitor at ragib.dev] (Loads static page in 30ms)
```

- **In Local Development (`npm run dev`)**:
  - Tina runs in local mode using the local filesystem (`@tinacms/cli`), reading and writing directly to `content/posts/` and `public/posts/` without requiring any cloud token.
- **In Production (`https://ragib.dev/admin`)**:
  - Tina authenticates via GitHub OAuth using Tina Cloud credentials.
  - Changes are committed straight to the repository branch, triggering automatic static redeployment.

---

## Skills & Code Inspected

- **AGENTS.md Section 5 & 6**:
  - "Content is MDX files in `content/posts/`, one file per post."
  - "The site is fully static."
  - "Never cross these boundaries. The browser holds no secret and never writes content [on the production blog routes]."
- **Code Inspected**:
  - `lib/content.ts`: Contains `PostFrontmatterSchema` validating `title`, `description`, `publishedAt`, `tags` against `siteConfig.tags`, `featured`, `cover`, and `draft`.
  - `site.config.ts`: Contains canonical tag list and author metadata.
  - `next.config.ts`: Needs a rewrite to route `/admin` to `/admin/index.html`.
  - `package.json`: Contains Next.js 16.3.5 and React 19.2.8. `tinacms` and `@tinacms/cli` support React 19 and Next.js 15+.

---

## Files to Touch

| File | Operation | Description |
| --- | --- | --- |
| `package.json` | Modify | Add `tinacms` and `@tinacms/cli` dependencies; update `dev` and `build` scripts |
| `tina/config.ts` | Create | Define Tina schema, post collection, tags options, image uploads, and Callout template |
| `next.config.ts` | Modify | Add URL rewrite from `/admin` to `/admin/index.html` |
| `.gitignore` | Modify | Add `tina/__generated__` and `public/admin` |
| `.env.example` | Modify | Add `NEXT_PUBLIC_TINA_CLIENT_ID` and `TINA_TOKEN` documentation |

---

## Requirements

1. **Schema Fidelity**:
   - The TinaCMS collection must output valid frontmatter that strictly satisfies `PostFrontmatterSchema` in `lib/content.ts`.
   - Tags must be restricted to the valid options defined in `site.config.ts`.
2. **Media Handling**:
   - Media uploads must be configured to output to `public/posts` so `next/image` can resolve them seamlessly.
3. **No Breakage of Static Pipeline**:
   - Existing posts (`building-popcorn-...`, `welcome-to-ragib-dev`, etc.) must continue to be readable and editable in Tina.
   - The Next.js search index generator (`scripts/build-search-index.ts`) must run during build as usual.
4. **Clean Developer Experience**:
   - Running `npm run dev` starts the local Next.js dev server with local Tina admin active.
   - Accessing `http://localhost:3000/admin` loads the CMS dashboard.

---

## Acceptance Criteria

- [ ] `tinacms` and `@tinacms/cli` installed and compatible with React 19 / Next.js 16.
- [ ] `tina/config.ts` accurately models all existing post frontmatter fields and MDX body.
- [ ] Next.js rewrites `/admin` to `/admin/index.html`.
- [ ] Admin panel loads at `http://localhost:3000/admin` in local development mode without errors.
- [ ] Existing posts in `content/posts/` appear in the Tina admin list.
- [ ] `npx tsc --noEmit` and `npm run lint` pass with 0 errors.
- [ ] Static build (`npm run build`) succeeds and produces all static routes.

---

## Checks to Run

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

---

## Manual Test Steps

1. Run `npm run dev` and open `http://localhost:3000/admin`.
2. Verify that the TinaCMS dashboard loads.
3. Click on the **Post** collection and verify existing posts (e.g. Popcorn post) are listed.
4. Open an article and confirm that the title, description, published date, tags, and body are correctly populated.
5. Create a draft test post or upload an image and confirm that the file is written to `content/posts/`.
6. Run `npm run build` to confirm the static export succeeds with the new post.
