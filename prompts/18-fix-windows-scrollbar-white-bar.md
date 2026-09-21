# Implementation Prompt: Eliminate Windows Native White Scrollbar on Code Blocks & Hero Card

## 1. Goal
Permanently remove the Windows Chromium native white scrollbar bar (with stepper buttons `<` and `>`) from the hero `now.ts` code block and across all code blocks on the site.

---

## 2. Root Cause Analysis
1. **Windows Chromium `scrollbar-color` Bug**:
   - In CSS, when `scrollbar-color: ... transparent;` is declared on `*`, Chromium hands scrollbar rendering over to the Windows OS native windowing system.
   - On Windows (when the OS theme is in default light mode), the native OS scrollbar engine ignores `transparent` and renders an opaque **#FFFFFF white track** with native Windows stepper buttons (`<` and `>`), completely ignoring `-webkit-scrollbar` rules.
2. **Hero Code Block Should Not Scroll**:
   - The hero `now.ts` block is an introductory focal card, not a multi-hundred-line code snippet. Allowing a horizontal scrollbar on it clutters the hero fold.

---

## 3. Decisions & Technical Approach
1. **Remove `scrollbar-color` on `*`**:
   - Remove `scrollbar-color: var(--surface-3) transparent;` from `*` to re-enable Blink's `-webkit-scrollbar` custom styling engine.
2. **Comprehensive `-webkit-scrollbar` Styling with Button Suppression**:
   - Explicitly hide all scrollbar stepper buttons:
     ```css
     ::-webkit-scrollbar-button,
     .code__pre::-webkit-scrollbar-button {
       display: none !important;
       width: 0 !important;
       height: 0 !important;
     }
     ```
   - Explicitly lock the track background to the code container's dark background (`var(--code-bg)` / `#0c0c0f`):
     ```css
     .code__pre::-webkit-scrollbar-track {
       background: var(--code-bg) !important;
     }
     ```
3. **Hero `now.ts` Zero-Scrollbar Guarantee**:
   - On `.hero [data-slot="now"] .code__pre`:
     ```css
     .hero [data-slot="now"] .code__pre {
       overflow-x: hidden;
       scrollbar-width: none;
     }
     .hero [data-slot="now"] .code__pre::-webkit-scrollbar {
       display: none !important;
     }
     ```
   - Slightly optimize the font and gutter in `[data-slot="now"]` so code lines fit comfortably without text clipping on smaller desktop viewports.

---

## 4. Files to Touch
- `app/globals.css` [MODIFY]

---

## 5. Acceptance Criteria
- [ ] The white scrollbar bar at the bottom of the hero `now.ts` code block is completely gone.
- [ ] No native Windows stepper arrows (`<` and `>`) appear on code blocks.
- [ ] Any scrollable code block in articles displays a dark track (`var(--code-bg)`) and thin dark thumb, never white.
- [ ] `npx tsc --noEmit` and `npm run lint` pass with 0 errors.

---

## 6. Manual Verification Steps
1. Refresh `http://localhost:3000/`.
2. Inspect the Hero `now.ts` card: verify the bottom has no white bar and sits cleanly dark with rounded corners.
3. Inspect an article with a long code block (`/articles/building-vertex-a-learning-platform-with-timestamp-search`): verify horizontal scrolling uses a dark track without white stepper bars.
