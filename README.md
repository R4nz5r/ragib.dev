# margin

A fast, content-first personal tech blog with MDX articles, full-text client search, an interactive table of contents, RSS feed, and newsletter integration powered by Resend.

---

## Quickstart

### Prerequisites
- Node.js 18.17+ or Node.js 20+
- npm, pnpm, or yarn

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your configuration:
- `NEXT_PUBLIC_SITE_URL`: Your site domain (e.g. `http://localhost:3000` in dev, `https://yourdomain.com` in production).
- `RESEND_API_KEY`: Your server-side API key from [resend.com/api-keys](https://resend.com/api-keys).
- `RESEND_AUDIENCE_ID`: Your audience ID from [resend.com/audiences](https://resend.com/audiences).

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the blog.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## Authoring Posts

Articles live in `content/posts/<slug>.mdx`. The file name determines the URL slug (`/articles/<slug>`).

### Frontmatter Fields

Every post requires structured frontmatter validated with Zod:

```yaml
---
title: "Your Post Title"
description: "A concise summary for post cards, search indexing, and meta tags."
publishedAt: "2026-09-20"
tags: ["TypeScript", "Next.js"]
featured: false # optional: true to feature at the top of the archive
updatedAt: "2026-09-21" # optional: shows "Updated <date>" in post header
draft: false # optional: true hides post in production, visible in dev
cover: # optional thumbnail
  src: "/posts/your-post/cover.png"
  alt: "Cover image description"
---
```

> [!IMPORTANT]
> **Tags**: All tags must match the list defined in `site.config.ts`. If an unknown tag is used, the build will fail immediately with the exact file name and offending tag.

### Code Blocks

Code blocks support syntax highlighting with Shiki, title badges, and line highlighting:

````markdown
```tsx title="app/page.tsx" {1,3-5}
export default function Page() {
  return <h1>Hello world</h1>;
}
```
````

- `title="..."` sets the file name in the top bar.
- `{1,3-5}` highlights lines 1 and 3 through 5.
- Includes a copy button that copies raw code without line numbers.

### Callouts

Use callouts for callout boxes:

```mdx
<Callout type="info" title="Note">
Here is helpful context or a tip for the reader.
</Callout>

<Callout type="warning" title="Warning">
Here is a cautionary notice or breaking change alert.
</Callout>
```

Plain blockquotes (`> quote`) render with an accent bar and large editorial type.

---

## Site Configuration

All site-wide details are managed in [`site.config.ts`](site.config.ts):

- **Site Information**: `name`, `url`, `description`.
- **Author Information**: `name`, `role`, `initials`, `bio`.
- **Social Links**: `github`, `x`, `email`, `rss`.
- **Navigation**: Toggle `published: true` on `Projects`, `About`, or `Uses` when pages are created.
- **Current Focus (`now`)**: The object displayed in the hero code block.
- **Tags**: Allowed tag categories for posts.
