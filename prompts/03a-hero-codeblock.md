# 03a Hero & CodeBlock

Implementation prompt for the CodeBlock component, the homepage hero section, the newsletter API stub with live form state management, the homepage layout with an archive slot, and the CodeBlock showcase in `/dev/components`.

---

## Goal

1. **CodeBlock Component**: Finalize the CodeBlock component matching the Components tab of `design/blog-ui-kit.html`:
   - 48px top bar with file title, language badge, and Copy button.
   - Server-rendered Shiki syntax highlighting.
   - Line numbers rendered strictly via CSS counters (`counter(ln)` on `.line::before`, `user-select: none`), ensuring they cannot be selected or copied.
   - Highlighted lines (`.line--hl`) with accent tint fill and 2px inset accent bar.
   - Horizontal scrolling strictly inside the `.code__pre` container without horizontal page scroll at 390px.
   - Copy button as a small client component copying only the raw source code and showing a 2-second "Copied" feedback state.
2. **Homepage Hero**:
   - Add `hero` object (`heading`, `lead`) to `site.config.ts`.
   - Render hero section matching desktop (1440px) and mobile (390px) designs:
     - Left column (7 cols on desktop, full on mobile): `h1` heading (`t-h1`), lead (`hero__lead t-prose`), social buttons (GitHub and X outline buttons), and the newsletter signup form.
     - Right column (5 cols on desktop, full on mobile): serialize the `siteConfig.now` object into TypeScript code on the server and render it through `CodeBlock` with file name `now.ts` and line 4 highlighted (`hl:[4]`).
3. **Newsletter API Route & Client Form**:
   - `POST /api/newsletter`: server route validating `{ email: string }` with Zod. Responds with status 200 `{ status: "not_configured", message: "Newsletter provider is not configured yet." }` or status 400 on invalid input.
   - `components/newsletter-form.tsx`: client component supporting `default`, `submitting`, `success`, and `error` states. On success, the caption becomes the accent-colored confirmation text: `"Thanks. Check your inbox to confirm your email."` with `.signup__note.is-done` matching the design prototype.
4. **Homepage Shell Update (`app/page.tsx`)**:
   - Replace the initial foundation placeholder with `<Hero />`.
   - Include a clearly marked archive slot (`data-slot="archive"`) where the searchable article archive, category filters, and pagination will be integrated in step 03b.
5. **Component Showcase Update (`/dev/components`)**:
   - Add the Code block section matching the Components tab:
     - Default, Copy idle (`theme.ts`)
     - Highlighted lines ({3-4}), Copied state (`forceCopied={true}`)

---

## Design reference

- `design/blog-ui-kit.html`:
  - **Homepage Hero** (lines 855–874):
    - Layout: `.hero`, `.wrap .grid12 .hero__grid`
    - Copy: `.c-7 .hero__copy` with `.t-h1`, `.hero__lead .t-prose`, `.hero__links`, `.signup`
    - Now slot: `.c-5 [data-slot="now"]`
  - **Hero & Form CSS** (lines 298–308 & 437–444):
    - Desktop: `.hero` (padding 64px 0, bottom border 1px), `.hero__grid` (align center), `.hero__lead` (max 560px), `.signup` (max 520px), `.signup__row` (flex row, field flex 1).
    - Mobile (≤720px): `.hero` (padding 48px 0), `.hero__grid` (row-gap 32px, align start), `.hero__links .btn` (flex 1), `.signup__row` (flex column, field flex none, btn width 100%).
    - Note: `.signup__note` (caption `t-cap`), `.signup__note.is-done` (`color: var(--accent-text)`).
  - **Components tab Code block** (lines 257–268, 738–749, 1064–1071, 1230–1232):
    - Container `.code`, top bar `.code__bar` (48px height), `.code__file`, `.lang`, `.code__pre` (counter-reset `ln`, tab-size 2), `.line` (counter-increment `ln`), `.line::before` (width 32px, color `var(--text-4)`, non-selectable), `.line--hl`.
    - Sample lines for showcase (`theme.ts` lines 1056–1062).
  - **`now.ts` block** (lines 1028–1037 & 1131):
    - Source serialization with line 4 highlighted (`building: "a type-safe CMS on Next.js"`).

---

## Architecture & Implementation Plan

### 1. Site Config Update (`site.config.ts`)
Add `hero` object to `siteConfig`:
```ts
hero: {
  heading: "I'm Sam. I build for the web and write down what I learn.",
  lead: "Full-stack developer. These are notes on React, Next.js and the architecture decisions behind production apps, published as I go.",
},
```

### 2. CodeBlock & CopyButton Enhancements
- In `components/mdx/copy-button.tsx`:
  - Add optional `forceCopied?: boolean` prop.
  - When `forceCopied` is true, render the copied state (check icon, "Copied" text, accent text color) for static showcase in `/dev/components`.
- In `components/mdx/code-block.tsx`:
  - Add `className?: string` and `forceCopied?: boolean` props.
  - Forward `forceCopied` to `<CopyButton />`.
  - Maintain the Shiki token rendering and non-selectable counter lines.

### 3. Server-Side `now.ts` Serialization (`lib/now.ts`)
Create a helper to serialize `siteConfig.now` into TypeScript code matching the design:
```ts
// what I'm working on right now
export const now = {
  role: "Full-stack developer",
  building: "a type-safe CMS on Next.js",
  learning: ["React Compiler", "Postgres RLS"],
  stack: ["TypeScript", "Next.js", "Tailwind"],
  writing: "every other week",
} as const;
```
Line 4 (`building: ...`) is marked for line highlighting: `{4}`.

### 4. Newsletter Route Handler (`app/api/newsletter/route.ts`)
- Server-side only, validates input with Zod:
  `z.object({ email: z.string().email("Please enter a valid email address.") })`
- If email format is invalid: return 400 with `{ error: "Please enter a valid email address." }`.
- If valid: return 200 with `{ status: "not_configured", message: "Newsletter provider is not configured yet." }`.
- Never stores addresses in logs or repository.

### 5. Newsletter Form (`components/newsletter-form.tsx`)
- Client component with `<form className="signup">`:
  - Input field (`<label className="field">` with mail icon and email input).
  - Submit button: `<Button variant="primary" size="lg" type="submit" disabled={isSubmitting}>`.
  - Caption note `<p className="signup__note t-cap">`:
    - Default: `"One email a month. Unsubscribe anytime."`
    - Submitting: `"Subscribing..."`
    - Success: `"Thanks. Check your inbox to confirm your email."` with `className="signup__note t-cap is-done"` (`text-accent-text`).
    - Error: error message with warning styling.

### 6. Hero Component (`components/hero.tsx`)
- Server component rendering:
  - `<section className="hero">`
  - `.wrap.grid12.hero__grid`
  - `.c-7.hero__copy`:
    - `<h1 className="t-h1">{siteConfig.hero.heading}</h1>`
    - `<p className="hero__lead t-prose">{siteConfig.hero.lead}</p>`
    - `.hero__links` with outline GitHub and X buttons.
    - `<NewsletterForm />`
  - `.c-5` with `now.ts` code block:
    - `<CodeBlock code={nowCode} language="ts" meta='title="now.ts" {4}' />`

### 7. Homepage Update (`app/page.tsx`)
- Replace the foundation placeholder with:
  - `<Hero />`
  - Archive slot placeholder:
    `<div data-slot="archive" className="wrap py-s-8 text-center text-text-3 border-t border-border">`
    `{/* Archive slot — search, category pills, featured post, article grid, pagination */}`
    `</div>`

### 8. Dev Components Showcase Update (`app/dev/components/page.tsx`)
- Add the Code block section below the existing components:
  - Default state (`theme.ts`, Copy idle).
  - Highlighted state (`theme.ts`, lines 3-4 highlighted, Copied state).

---

## Files to touch

| File | Action | Purpose |
|---|---|---|
| `site.config.ts` | Modify | Add `hero` heading and lead fields |
| `app/globals.css` | Modify | Add `.hero` and `.signup` desktop and mobile styles |
| `components/mdx/copy-button.tsx` | Modify | Add `forceCopied` prop |
| `components/mdx/code-block.tsx` | Modify | Add `forceCopied` and `className` props |
| `lib/now.ts` | New | Helper to serialize `siteConfig.now` to TypeScript source |
| `app/api/newsletter/route.ts` | New | Stub newsletter API route validating email with Zod |
| `components/newsletter-form.tsx` | New | Client newsletter signup form with 4 visual states |
| `components/hero.tsx` | New | Server hero component |
| `app/page.tsx` | Modify | Render Hero and archive slot |
| `app/dev/components/page.tsx` | Modify | Add CodeBlock default and copied showcase |

---

## Acceptance Criteria

1. `site.config.ts` contains `hero.heading` and `hero.lead`.
2. The homepage at `/` displays the hero matching the design at desktop (1440px) and mobile (390px) with zero horizontal overflow.
3. The `now` block displays `now.ts` with line 4 highlighted, line numbers from CSS counters, and language badge `TS`.
4. Copying code from `now.ts` or any code block copies only raw source text, not line numbers.
5. POST `/api/newsletter` validates email with Zod and responds with status 200 "not configured" or 400 on invalid email.
6. The newsletter form displays all 4 states correctly: default, submitting, success (accent-colored confirmation note), and error.
7. An empty slot `data-slot="archive"` is present on `/` for step 03b.
8. `/dev/components` displays CodeBlock in default, highlighted, and Copied states.
9. `npx tsc --noEmit` passes with 0 errors.
10. `npm run lint` passes with 0 errors and 0 warnings.
11. `npm run build` succeeds cleanly.
