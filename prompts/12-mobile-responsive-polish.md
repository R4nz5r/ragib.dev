# Implementation Prompt: Mobile Responsive UI Polish (320px–390px)

## 1. Goal
Fix broken and unpolished mobile UI across the blog at mobile viewports (≤ 720px, specifically targeting standard 390px and small 320px screens) to match the mobile artboards in `design/blog-ui-kit.html`. Specifically resolve the broken feature card section, polish the email newsletter subscription forms, fix category pill overflow, correct navcard stacking, and restore proper container padding.

---

## 2. Root Cause Analysis
1. **CSS Cascade Inversion**:
   In `app/globals.css`, the primary `@media (max-width: 720px)` block was placed near the top (line 272), before the base desktop component rules (lines 470–1550).
   In CSS, rules of equal specificity defined later in the stylesheet take precedence. Consequently:
   - `.card--feature { flex-direction: row; }` and `.thumb { flex: 0 0 50%; min-height: 360px; }` (line 944) overrode the mobile column styles (line 352). On mobile, the featured card remained a horizontal 50/50 split with a 360px image, crushing the text down to ~90px and blowing out horizontal viewport bounds.
   - `.pills { display: flex; flex-wrap: wrap; }` (line 1002) overrode the horizontal scroll behavior (line 342), causing pills to wrap into 4 clunky lines.
   - `.signup__row .field { flex: 1; min-width: 0; }` (line 789) overrode `flex: none` (line 328).
   - `.news` had 48px padding (`var(--s-6)`) which severely squeezed content on narrow screens.
2. **Email Submit Section Styling**:
   On desktop, the newsletter form is a compact horizontal row (`[ ✉ you@example.com ] [ Subscribe ]`). On mobile, the previous rule forced it into two full-width 48px stacked blocks where the button became a massive solid purple slab dominating the viewport. Making the subscription bar sleek, compact, and inline (or neatly integrated) preserves vertical rhythm and matches the desktop aesthetic.

---

## 3. Design Reference Matching
- **Reference**: `design/blog-ui-kit.html` lines 422–481 (`@container ab (max-width:720px)`).
- **Frames to Match**:
  - `Homepage (Mobile 390, 4 columns, 16px margins)`
  - `Article (Mobile 390, TOC disclosure, stacked navcards, responsive news box)`

---

## 4. Code Inspected
- `design/blog-ui-kit.html`: Mobile container query rules and artboard templates.
- `app/globals.css`: Media query placement, `.card--feature`, `.signup`, `.signup__row`, `.field`, `.news`, `.pills`, `.navcards`.
- `components/hero.tsx`: Hero layout with `hero__copy`, `hero__links`, `NewsletterForm`, and `CodeBlock`.
- `components/newsletter-form.tsx`: Form markup, honeypot, field, and button.
- `components/archive.tsx`: Section head, filters, featured card slot, post grid.
- `app/articles/[slug]/page.tsx`: Article layout, mobile TOC, navcards, newsletter section.

---

## 5. Decisions & Technical Approach
1. **Consolidate Mobile CSS at the End of `app/globals.css`**:
   Remove the misplaced `@media (max-width: 720px)` from line 272 and the scattered fragments at lines 442 and 1555. Place one unified, well-structured `@media (max-width: 720px)` block at the bottom of the stylesheet (before `@media (prefers-reduced-motion)`), guaranteeing mobile rules cleanly override desktop defaults.
2. **Fix Featured Post Card (`.card--feature`)**:
   - `flex-direction: column`
   - `.thumb`: `flex: none`, `width: 100%`, `aspect-ratio: 16 / 9`, `min-height: 0`, `border-right: 0`, `border-bottom: 1px solid var(--border)`
   - `.card__body`: `padding: var(--s-3)` (24px)
   - `.card__title`: `font-size: 24px`, `line-height: 32px`
   - `.thumb__g`: `font-size: 40px`, `line-height: 48px`
   - Hide author row button: `.card__by .btn { display: none; }`
3. **Polish Email Submit Section**:
   - Render `.signup__row` as a cohesive, inline row (`flex-direction: row; align-items: center; gap: var(--s-1); width: 100%;`).
   - `.field`: `flex: 1; min-width: 0; height: 48px;`
   - `.btn`: `flex: none; height: 48px; white-space: nowrap; padding: 0 var(--s-2);`
   - This keeps the input and "Subscribe" button on a single compact line (fits comfortably even on 320px screens), eliminating the oversized stacked purple slab.
4. **Horizontal Scroll for Category Pills**:
   - `.pills`: `flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; margin-inline: calc(-1 * var(--s-2)); padding-inline: var(--s-2);`
   - `.pills::-webkit-scrollbar { display: none; }`
5. **Article Navcards & News Box**:
   - `.navcards > .navcard, .navcards > .navcard--next`: span full width (`grid-column: 1 / -1; width: 100%;`).
   - `.navcard--next`: text-align left with left-aligned arrow.
   - `.news`: `grid-template-columns: minmax(0, 1fr); padding: var(--s-3); gap: var(--s-3); margin-top: var(--s-4);`
6. **No Side Scrolling**:
   Ensure `.wrap` has `padding-inline: var(--s-2);` (16px) and no child element causes horizontal viewport overflow.

---

## 6. Files to Touch
- `app/globals.css`

---

## 7. Acceptance Criteria
- [ ] Featured card on mobile is a clean vertical card with 16:9 aspect-ratio thumbnail on top and no horizontal overflow.
- [ ] Email submit sections (hero and article footer) display as a sleek, aligned inline row without awkward wrapping or excessive vertical bulk.
- [ ] Category pills scroll horizontally on mobile with hidden scrollbars.
- [ ] Article navigation cards stack vertically with left-aligned content.
- [ ] Article newsletter card (`.news`) has proportional 24px padding instead of 48px desktop padding.
- [ ] Page never scrolls horizontally on mobile (tested down to 320px).
- [ ] `npm run build`, `npm run lint`, and `npx tsc --noEmit` pass with 0 errors.

---

## 8. Manual Verification Steps
1. Open Chrome DevTools with device emulation at `390 x 844` (iPhone 12/13/14) and `320 x 688` (Small mobile).
2. Visit `http://localhost:3000/`:
   - Inspect Hero: Check heading, GitHub/X buttons (50% width each), and email submit bar (inline with input + Subscribe button).
   - Inspect Filter bar: Verify category pills scroll horizontally without wrapping.
   - Inspect Featured card: Verify card is vertical with 16:9 thumbnail, 24px title, and no "Read article" button.
   - Inspect Article grid: Verify cards stack in 1 column with equal heights.
3. Visit `http://localhost:3000/articles/building-fast-web-apps-with-nextjs`:
   - Inspect TOC disclosure above article.
   - Inspect Previous / Next navcards: Verify both stack vertically and text is left-aligned.
   - Inspect Newsletter box at bottom: Verify clean padding and inline email input + button.
4. Verify that the window cannot be scrolled horizontally at any viewport width.
