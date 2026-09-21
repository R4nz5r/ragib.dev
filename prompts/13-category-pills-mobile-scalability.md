# Implementation Prompt: Category Pills Mobile Layout & Future Scalability

## 1. Goal
Fix the broken category filter pills beneath the search bar on mobile (where text and counts wrap vertically into squished boxes) and future-proof the category filter system so adding any number of future tags (such as JavaScript, NestJS, Ruby, Go, etc.) will never break the layout, distort pill shapes, or push articles down the screen on mobile devices.

---

## 2. Root Cause Analysis
1. **Missing Base Component CSS for `.pill` and `.pill__n`**:
   In `app/globals.css` (lines 415–438), only pseudo/active states (`.pill:hover`, `.pill.is-active`) were defined. The base styles from `design/blog-ui-kit.html` (line 211) were completely omitted:
   - Missing `display: inline-flex; align-items: center; gap: var(--s-1);`
   - Missing `height: 32px; padding: 0 var(--s-2);`
   - Missing `border: 1px solid var(--border); border-radius: var(--r-full);`
   - Missing `white-space: nowrap;`
   - Missing `flex: none; flex-shrink: 0;`
   - Missing `.pill__n` font styling (`font: 500 13px/18px var(--font-mono); color: var(--text-4);`).
2. **Text Wrapping & Flex Compression**:
   Because `.pill` defaulted to standard button styling without `white-space: nowrap;` and without `flex-shrink: 0;`, the browser compressed each button horizontally and wrapped the text:
   - "All" on line 1, "3" on line 2
   - "TypeScript" on line 1, "3" on line 2
   - "CSS" on line 1, "Architecture" on line 2, "0" on line 3
   With `.is-active` background applied, it turned into an awkward tall purple box.

---

## 3. Senior Developer Recommendation for Future Scalability
When authors add many tags over time (e.g. JavaScript, NestJS, Ruby, React, CSS Architecture, DevOps, etc.):

1. **Mobile (< 720px) — Single Non-Wrapping Touch-Scroll Track**:
   - Keep pills in a clean single row: `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;`.
   - Every pill enforces `flex-shrink: 0; white-space: nowrap;`.
   - Result: Whether you have 3 tags or 50 tags, they will smoothly swipe horizontally. They will **never** stack vertically, never distort, and never push articles down the mobile screen.
   - Screen bleed margins (`margin-inline: -16px; padding-inline: 16px;`) let the rightmost pill peek off-screen, visually hinting to the user that more tags can be scrolled horizontally.
2. **Desktop (> 720px) — Top-Aligned Wrapping Grid**:
   - `.filters { align-items: flex-start; }` ensures that when tags wrap into multiple rows in the 8-column area (`c-8`), the search input remains pinned to the top rather than vertically centering or shifting.
3. **Zero-Count Tags Handling**:
   - Derived counts (`tagCounts[tag] ?? 0`) match `site.config.ts`. In the future, if you add a tag to `site.config.ts` before writing a post for it, it displays neatly with `0` without breaking any styles.

---

## 4. Design Reference Matching
- **Reference**: `design/blog-ui-kit.html` (lines 211–220 for component tokens, lines 447–450 for mobile container rules).
- Exact specification:
  - Height: `32px`
  - Border radius: `var(--r-full)` (999px)
  - Spacing: `padding: 0 var(--s-2)` (16px), `gap: var(--s-1)` (8px)
  - Font: `500 14px/24px var(--font-ui)` for text, `500 13px/18px var(--font-mono)` for count (`.pill__n`)
  - States: default, hover (`var(--surface-2)`), active (`var(--accent-tint)` with `var(--accent-line)` border and `var(--accent-text)` color).

---

## 5. Proposed Code Changes

### Component Styling
#### [MODIFY] [app/globals.css](file:///f:/Nextjs/blog/app/globals.css)
1. Add `.pill`, `.pill__n`, `.tag`, and `.kbd` base definitions right before line 415.
2. Update `.filters` at line 817 to `align-items: flex-start;`.
3. In `@media (max-width: 720px)` (around line 1515), ensure `.pills` has:
   ```css
   .pills {
     grid-column: 1 / -1;
     width: 100%;
     display: flex;
     flex-wrap: nowrap;
     overflow-x: auto;
     margin-inline: calc(-1 * var(--s-2));
     padding-inline: var(--s-2);
     scrollbar-width: none;
     -webkit-overflow-scrolling: touch;
     overscroll-behavior-x: contain;
     scroll-padding-inline: var(--s-2);
   }
   .pill {
     flex-shrink: 0;
     white-space: nowrap;
   }
   ```

---

## 6. Verification Plan
### Automated Tests
- Run `npx tsc --noEmit` to verify type safety.
- Run `npm run lint` to ensure zero lint errors.
- Run `npm run build` to ensure static generation passes cleanly.

### Manual Verification
1. Inspect `http://localhost:3000` in mobile viewport (390px and 320px).
2. Confirm:
   - "All 3", "TypeScript 3", "Next.js 3", "CSS Architecture 0" render as sleek horizontal pill chips with 32px height and rounded full corners.
   - Text never splits or wraps vertically.
   - Active pill has light purple accent background and violet text with smooth rounded corners.
   - Pills scroll smoothly horizontally without showing a scrollbar.
3. Test future scenario:
   - Temporarily add "JavaScript", "NestJS", "Ruby" to `site.config.ts` tags array.
   - Verify all pills render cleanly in the scrollable track on mobile without breaking or wrapping.
   - Revert temporary tags.
