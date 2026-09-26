# 21 Auto-Draft Blog Post on Vercel Project Launch (`vercel-blog-bot`)

Implementation prompt for building an automated bot that polls the Vercel REST API for newly created projects, fetches contextual details and GitHub README, drafts a high-quality blog post using a free-tier LLM (Google Gemini or Groq), writes an `.mdx` file conforming strictly to the blog's frontmatter schema and conventions, and opens a GitHub Pull Request for human review.

---

## Goal

1. **Detect New Vercel Projects Without Paid/Pro Webhooks**:
   - Poll `https://api.vercel.com/v9/projects` on a scheduled GitHub Actions cron (and `workflow_dispatch`).
   - Track previously processed projects in a committed repository state file (`.github/state/seen-vercel-projects.json`).
   - Support both personal Vercel accounts and team accounts (via optional `VERCEL_TEAM_ID`).

2. **Gather Context**:
   - Extract project name, production domain/URL (`targets.production.url` or `alias`), and linked Git repository.
   - When a GitHub repository is linked, fetch the repo's `README.md` via the GitHub API to provide genuine technical context and architecture details.
   - Fall back gracefully to project metadata if unlinked or private.

3. **Draft Post via Free-Tier LLM**:
   - Use free-tier models with zero required billing: Google Gemini (e.g. `gemini-2.5-flash` or `gemini-2.0-flash` via AI Studio) with support for Groq (e.g. `llama-3.3-70b-versatile` / `llama-3.1-8b-instant`).
   - Instruct the LLM in Ragib's voice (first-person technical developer blog) following existing blog conventions:
     - Clear problem statement and solution introduction with live demo link.
     - Section `## The Tech Stack` with bulleted breakdown.
     - Section `## Core Architecture & Engineering Highlights` with code block or architectural breakdown.
     - Section `## Live Demo & Source Code` linking to the deployment and repository.

4. **Match Existing Blog Schema & Conventions**:
   - Adhere strictly to `PostFrontmatterSchema` in `lib/content.ts`:
     - `title`: string
     - `description`: 1-2 sentence excerpt
     - `publishedAt`: ISO date timestamp string
     - `tags`: valid tags starting with relevant members from `siteConfig.tags` in `site.config.ts` (e.g., `Next.js`, `TypeScript`, `React`, `Architecture`)
     - `featured`: `false`
     - `draft`: `false`
   - File path: `content/posts/<slug>.mdx` (slugified title).

5. **Automate Branch & PR Creation**:
   - Never auto-publish directly to `main`.
   - Create a dedicated branch `auto-post/<slug>`.
   - Commit the new post file and the updated state file.
   - Open a pull request against `main` using GitHub CLI (`gh pr create`) with a detailed review summary.

---

## Design Reference & Conventions

- **Design & Layout**:
  - The generated post will render seamlessly through the existing `app/articles/[slug]/page.tsx` template, table of contents (`Toc`), and MDX components (`Callout`, Shiki code blocks).
- **Existing Post Structures Inspected**:
  - `content/posts/building-popcorn-real-time-synchronized-watch-parties.mdx`
  - `content/posts/building-an-ai-powered-form-builder-with-gemini-react-19-and-postgresql.mdx`
  - `content/posts/building-vertex-a-learning-platform-with-timestamp-search.mdx`
- **Conventions Preserved**:
  - Frontmatter uses YAML delimiters `---`.
  - Tags are formatted as YAML list items.
  - Section dividers use `***`.
  - Headings use `##` and `###` which feed directly into the sticky Table of Contents.
  - Code blocks use fenced syntax with `title="..."` metadata.

---

## Skills & Code Inspected

- **AGENTS.md Section 1**:
  - Fast, content-first blog for a web developer, MDX articles, keyboard friendly, dark/light themes.
- **AGENTS.md Section 5 & 8**:
  - Content is MDX files in `content/posts/<slug>.mdx`.
  - Required frontmatter: `title`, `description`, `publishedAt`, `tags`. Optional: `featured`, `cover`, `draft`.
  - Derived, never stored: reading time, table of contents, search index.
- **AGENTS.md Section 11**:
  - Keep pages static, format dates in ISO format, strict validation.
- **Code Inspected**:
  - `lib/content.ts`: `PostFrontmatterSchema` Zod validation, `parsePostFile`.
  - `site.config.ts`: `siteConfig.tags` = `["TypeScript", "Next.js", "CSS Architecture", "Architecture", "React", "Performance"]`.
  - `package.json`: scripts and dependencies.
  - `.env.example`: existing project environment variable patterns.

---

## Decisions & Assumptions

1. **Language & Runtime for Script**:
   - `scripts/detect-and-draft.mjs` using native Node.js ESM.
   - Built-in `fetch` for all HTTP requests (Vercel API, GitHub API, LLM API) to avoid adding heavy SDK dependencies to `package.json`.
2. **State Tracking**:
   - `.github/state/seen-vercel-projects.json` stores array of handled Vercel project IDs: `["prj_..."]`.
   - If the file is not present on initial run, the script initializes it.
   - On the very first run, if state is empty, to prevent spamming PRs for historic projects, the script can either record existing projects as seen or process only the single newest project. We will provide a safeguard that limits processing to at most 1 new project per run.
3. **LLM Provider Choice**:
   - Support `LLM_API_KEY` (or `GEMINI_API_KEY`) for Google Gemini (`gemini-2.5-flash` or `gemini-2.0-flash` via Google AI Studio API: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`).
   - Also support `GROQ_API_KEY` with automatic fallback/selection (`https://api.groq.com/openai/v1/chat/completions` using `llama-3.3-70b-versatile`).
4. **Vercel API & Team ID**:
   - Endpoint: `https://api.vercel.com/v9/projects`.
   - If `VERCEL_TEAM_ID` is defined, append `?teamId=${VERCEL_TEAM_ID}`.
5. **Git Operations in Actions**:
   - Workflow uses `actions/checkout@v4` with write permissions (`contents: write`, `pull-requests: write`).
   - Uses `gh pr create` with `GITHUB_TOKEN` so no additional personal access token (PAT) is required for opening pull requests.
6. **Dry Run / Local Testing**:
   - Support `DRY_RUN=true` or `--dry-run` flag so the script can be tested locally without making git commits or pushing branches.

---

## Files to Touch

| File | Operation | Description |
| --- | --- | --- |
| `.github/state/seen-vercel-projects.json` | Create | Initial empty/seeded state file for tracked Vercel projects |
| `.github/workflows/vercel-blog-bot.yml` | Create | GitHub Actions cron and manual dispatch workflow |
| `scripts/detect-and-draft.mjs` | Create | Core detection, context collection, LLM drafting, and post writing script |
| `.env.example` | Modify | Document `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`, and `LLM_API_KEY` |
| `package.json` | Modify | Add `"bot:detect-and-draft": "node scripts/detect-and-draft.mjs"` script |

---

## Requirements

1. **Vercel Project Polling**:
   - Authenticate with `VERCEL_API_TOKEN`.
   - Diff fetched project IDs against `.github/state/seen-vercel-projects.json`.
   - Exit cleanly with code 0 and informative message when no new projects are found.
2. **Context Enrichment**:
   - Extract project name, domains, and Git repository URL.
   - Fetch `README.md` from linked GitHub repository using GitHub API / raw content.
3. **AI Post Generation**:
   - Generate post matching Ragib's developer persona and tone.
   - Produce valid frontmatter conforming to `PostFrontmatterSchema`.
   - Include tech stack, architecture highlights, code snippets, and live demo / source links.
4. **MDX File Creation**:
   - Write to `content/posts/<slug>.mdx`.
   - Ensure slug collision safety.
5. **Pull Request Creation**:
   - Create branch `auto-post/<slug>`.
   - Commit the `.mdx` file and updated state JSON.
   - Open a PR titled `New post: <title> (AI-drafted)` with a clear notification that human review is required before merging.
6. **Robust Error Handling**:
   - Graceful error reporting if secrets are missing or API limits are encountered.

---

## Security Considerations

- `VERCEL_API_TOKEN`, `LLM_API_KEY`, and `GITHUB_TOKEN` are supplied via GitHub Secrets and environment variables; never logged or committed to the repository.
- Workflow runs with least-privilege `pull-requests: write` and `contents: write`.
- Automated PRs never push directly to `main`, requiring explicit human review and approval.

---

## Acceptance Criteria

- [ ] `.github/state/seen-vercel-projects.json` is initialized.
- [ ] `scripts/detect-and-draft.mjs` handles project fetching, state diffing, README resolution, AI drafting, frontmatter formatting, and file writing.
- [ ] Running the script with `--dry-run` or mock project simulates the entire drafting workflow and verifies the generated MDX against `lib/content.ts` Zod validation without errors.
- [ ] `.github/workflows/vercel-blog-bot.yml` is syntactically valid and configures scheduled runs (`0 * * * *`) and `workflow_dispatch`.
- [ ] `.env.example` includes documentation for all bot-related secrets.
- [ ] Existing checks (`npm run lint`, `npx tsc --noEmit`, `npm run build`) continue to pass cleanly.

---

## Checks to Run

1. `node scripts/detect-and-draft.mjs --help` (verify argument handling and configuration validation)
2. `npx tsx scripts/verify-content.ts` (verify content pipeline remains healthy)
3. `npm run lint` (verify linting rules pass)
4. `npx tsc --noEmit` (verify TypeScript typecheck passes)
5. `npm run build` (verify production build succeeds)

---

## Manual Test Steps

1. Run `node scripts/detect-and-draft.mjs --dry-run` with a sample Vercel project payload to verify that:
   - The LLM prompt and response parsing work as expected.
   - The generated post has valid frontmatter and compiles cleanly with `parsePostFile`.
2. Inspect the generated `.mdx` file in `content/posts/` and verify layout, headings, tags, and formatting.
3. Check the `.github/workflows/vercel-blog-bot.yml` configuration and verify secret names and triggers.
