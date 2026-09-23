# Implementation Prompt: Write New Blog Post for Bookified

## 1. Goal
Create a comprehensive, production-grade technical blog post titled **"Building Bookified: Turning Books into Interactive AI Voice Conversations"** based on the author's open-source repository [R4nz5r/Bookified](https://github.com/R4nz5r/Bookified) and live application [bookified-dun.vercel.app](https://bookified-dun.vercel.app). The article will document the engineering challenges, system architecture, client-side PDF parsing and cover generation, chunking strategies, MongoDB scoped full-text search, and real-time voice AI integration with Vapi and ElevenLabs.

---

## 2. Design Frames & Components Matched
- **Article Frame (Desktop 1440px & Mobile 390px)**: Matches the reference design in `design/blog-ui-kit.html`.
- **Top Metadata**: Header with title, description, published date `<time datetime>`, reading time pill, author byline, category pills (`Next.js`, `React`, `TypeScript`, `Architecture`, `AI`).
- **Cover Image**: `/posts/bookified.png` downloaded directly from the official repository assets.
- **Code Blocks**: Formatted with file titles, language badges, line numbers, and highlighted line markers (` ```tsx title="hooks/useVapi.ts" {15-22} `).
- **Callouts**: Using the custom `<Callout type="info" title="..." />` MDX component.
- **Table of Contents**: Derived from stable `h2` and `h3` headings, adhering to sticky sidebar navigation on desktop and mobile disclosure format.
- **Links**: Live website demo (`https://bookified-dun.vercel.app`) and GitHub source repository (`https://github.com/R4nz5r/Bookified`).

---

## 3. Inspected Repository Code & Architecture
The Bookified application was inspected via GitHub API and raw file fetching:
1. **Frontend & Stack**:
   - Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript, Lucide React, Sonner.
   - Clerk for authentication, protecting uploads and voice sessions.
   - `@vercel/blob/client` for direct-to-blob storage of book PDFs and generated cover images.
2. **Client-Side PDF Processing (`lib/utils.ts` & `components/UploadForm.tsx`)**:
   - Uses `pdfjs-dist` inside the browser web worker.
   - Renders the first page to an HTML5 `<canvas>` to dynamically generate a 2x scale PNG cover data URL, eliminating the need for server-side rasterization or headless browser services.
   - Extracts raw text page by page (`textContent.items`) and cleans whitespace.
3. **Contextual Segmentation & Chunking**:
   - `splitIntoSegments`: Segments full book text into 500-word windows with a 50-word sliding overlap, preventing topic cut-offs at arbitrary chunk borders.
4. **Data Persistence & Compound Text Indexing**:
   - `database/models/book.model.ts` stores book metadata, slug, Clerk user ID, blob URLs, and segment counts.
   - `database/models/book-segment.model.ts` stores individual chunks with a compound index `{ bookId: 1, segmentIndex: 1 }` (unique) and a text search index `{ bookId: 1, content: "text" }`.
5. **Real-Time Voice AI Pipeline (`hooks/useVapi.ts` & ElevenLabs)**:
   - Initialized via `@vapi-ai/web` with custom ElevenLabs voice personas (e.g., George, Sarah, Roger).
   - Manages WebRTC audio sessions, speech events (`speech-start`, `speech-end`, `call-start`, `call-end`), duration tracking, and streaming partial and final transcripts.
6. **Two-Way Tool Calling Webhook (`app/api/vapi/search-book/route.ts`)**:
   - Exposes a webhook endpoint to Vapi. When a user asks a spoken question, Vapi executes the `searchBook` tool call.
   - The route invokes `searchBookSegments(bookId, query)` in MongoDB using `$text` search score with regex fallback and regex character escaping (`escapeRegex`) to prevent ReDoS.
   - Returns relevant segment context to Vapi to synthesize real-time voice answers grounded in the book's text.

---

## 4. Decisions & Assumptions
- **File path**: `content/posts/building-bookified-interactive-ai-voice-conversations-with-books.mdx`
- **Cover image**: `public/posts/bookified.png` (already saved from Bookified assets)
- **Publication date**: `2026-09-23T10:00:00.000Z`
- **Tags**: `["Next.js", "React", "TypeScript", "Architecture", "AI"]` (aligning with `site.config.ts`)
- **Tone**: Technical, clear, architectural, and educational, consistent with Ragib's existing posts on Vertex and AI Form Builder.
- **Featured**: `false` (preserves existing featured post).

---

## 5. Files to Touch
- `public/posts/bookified.png` [NEW]
- `content/posts/building-bookified-interactive-ai-voice-conversations-with-books.mdx` [NEW]

---

## 6. Security Considerations
- All search queries passed into MongoDB regex queries use `escapeRegex` to prevent regular expression denial of service (ReDoS).
- Audio and book access is scoped by `bookId` and authenticated user sessions.
- No private API keys or tokens are exposed in MDX snippets or client-side bundles.

---

## 7. Acceptance Criteria
- [ ] MDX frontmatter strictly conforms to `PostFrontmatterSchema` in `lib/content.ts`.
- [ ] Word count, reading time, and TOC are correctly derived at build time.
- [ ] Code snippets use proper fences, titles, and line highlights.
- [ ] Callout component rendered cleanly without formatting issues.
- [ ] Live demo and GitHub repository links are present and correctly formatted.
- [ ] Search index generates cleanly and includes the new post.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm run build` static generation passes cleanly.

---

## 8. Verification Steps
1. Run `npx tsc --noEmit` and `npm run lint`.
2. Run `npm run build` and ensure all static pages and `public/search-index.json` are created without errors.
3. Start `npm run dev` and navigate to:
   - `http://localhost:3000/` (verify card appears in post grid with cover image, tags, date, and reading time).
   - `http://localhost:3000/articles/building-bookified-interactive-ai-voice-conversations-with-books` (verify full reading experience, TOC, code blocks with copy button, callout, and navigation).
   - Verify search filters on the homepage find "Bookified" instantly.
