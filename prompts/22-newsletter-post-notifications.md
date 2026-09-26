# 22 Automated Newsletter Post Notifications (Resend)

Implementation prompt for building an automated subscriber notification system that sends a beautifully styled announcement email via Resend to all active blog subscribers whenever a new post is published to `main` (either by the author or by the automated Vercel bot).

---

## Goal

1. **Automated Post Notifications**:
   - Detect when a new post is published in `content/posts/` and has not yet been broadcast to subscribers.
   - Track previously notified post slugs in a state file (`.github/state/notified-posts.json`) to prevent duplicate email sends.

2. **Audience Integration (Resend)**:
   - Fetch active contacts (`unsubscribed: false`) from Resend Audiences (`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`).
   - Use Resend API (`POST https://api.resend.com/emails/batch` or `POST https://api.resend.com/emails`) to deliver the email.
   - Send from verified domain: `Ragib <newsletter@blog.ragibshahrier.com>`.

3. **Email Design**:
   - Clean, modern, responsive HTML email matching the dark-theme aesthetic of `ragib.dev`.
   - Prominent header with site badge.
   - Post title, category tag pills, estimated reading time, and short excerpt.
   - High-contrast "Read Article" action button linking directly to `https://blog.ragibshahrier.com/articles/<slug>`.
   - Clean footer with copyright and author social links.

4. **GitHub Actions & CLI Workflow**:
   - Automated GitHub Actions workflow (`.github/workflows/notify-subscribers.yml`) that triggers on push to `main` whenever files under `content/posts/**.mdx` are added.
   - CLI script (`npm run notify-subscribers`) supporting:
     - Automatic detection of unnotified posts.
     - Specific slug targeted broadcast (`npm run notify-subscribers -- [slug]`).
     - `--dry-run` flag to preview rendered email HTML and recipient counts without sending.

---

## Design Reference & Aesthetics

- **Colors & Typography**:
  - Background: Dark card `#0d1117` with subtle `#1e2633` borders.
  - Accent: High-contrast purple `#6366f1` / `#7c3aed` for the primary CTA button.
  - Text: Clean sans-serif system typography with high legibility.
- **Components**:
  - Site header: `ragib.dev // articles`
  - Meta row: Date and Reading Time (`X min read`)
  - Tag pill badges.
  - "Read on the Blog" CTA button.

---

## Skills & Code Inspected

- **`site.config.ts`**:
  - `siteConfig.name`: `ragib.dev`
  - `siteConfig.url`: `https://ragib.dev` (or `https://blog.ragibshahrier.com`)
  - `siteConfig.author`: T.M Ragib Shahrier
- **`lib/content.ts`**:
  - `getAllPosts`, `getPostBySlug`, `calculateReadingTime`
- **`app/api/newsletter/route.ts`**:
  - Resend Audience subscriber collection
- **Resend Domain Verification**:
  - Verified domain `blog.ragibshahrier.com` with active DKIM/SPF and `newsletter@blog.ragibshahrier.com` sender.

---

## Decisions & Assumptions

1. **State Tracking**:
   - `.github/state/notified-posts.json` records slugs of posts that have already been emailed to subscribers.
   - Seeded with all existing historical posts so subscribers do not receive blast emails for past articles.
2. **Sender Address**:
   - `Ragib <newsletter@blog.ragibshahrier.com>` (using the verified custom domain).
3. **Resend Secrets**:
   - Uses `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` (available in `.env.local` and added to GitHub Secrets).
4. **Safety & Rate Limits**:
   - Batch sends up to 100 emails per batch or rate-limited sequential sends.
   - Skips unsubscribed contacts automatically.
   - `--dry-run` available for safe testing.

---

## Files to Touch

| File | Operation | Description |
| --- | --- | --- |
| `.github/state/notified-posts.json` | Create | Tracks slugs of already-emailed posts |
| `scripts/notify-subscribers.mjs` | Create | Notification script that fetches subscribers, renders HTML, and calls Resend API |
| `.github/workflows/notify-subscribers.yml` | Create | GitHub Actions workflow triggering on post additions |
| `package.json` | Modify | Add `"notify-subscribers": "node scripts/notify-subscribers.mjs"` |
| `.env.example` | Modify | Document `RESEND_FROM_EMAIL` |

---

## Requirements

1. **Post Parsing**:
   - Read post frontmatter, derive reading time and clean excerpt.
2. **Audience Resolution**:
   - Query Resend API for active contacts in audience.
3. **Email Generation**:
   - Render responsive HTML template with preview text and tracking-friendly direct links.
4. **Delivery**:
   - Send emails via Resend API and log delivery confirmation IDs.
5. **State Update**:
   - Commit updated `.github/state/notified-posts.json` upon successful delivery.

---

## Acceptance Criteria

- [ ] `.github/state/notified-posts.json` is initialized and seeded with existing post slugs.
- [ ] `node scripts/notify-subscribers.mjs --dry-run` renders the email template and lists recipient count without sending.
- [ ] Running with a test slug sends a delivery to active subscribers using `newsletter@blog.ragibshahrier.com`.
- [ ] `.github/workflows/notify-subscribers.yml` is syntactically valid and runs on pushes with post changes.
- [ ] `npm run lint` and `npx tsc --noEmit` pass with zero errors.

---

## Checks to Run

1. `node scripts/notify-subscribers.mjs --help`
2. `node scripts/notify-subscribers.mjs --dry-run`
3. `npm run lint`
4. `npx tsc --noEmit`
5. `npm run build`
