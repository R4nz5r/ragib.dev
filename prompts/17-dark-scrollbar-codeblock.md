# Implementation Prompt: Remove White Scrollbar & Style Dark Code Block Scrollbars

## 1. Goal
Completely remove the jarring, eye-catching white horizontal scrollbar bar at the bottom of the hero code block (`now.ts`) and all code blocks across the website, replacing it with modern, subtle, dark-mode scrollbars with transparent tracks and rounded pill thumbs matching developer platforms like VS Code and GitHub.

---

## 2. Root Cause Analysis
1. **Missing `color-scheme` in CSS**:
   - Neither `:root` nor `html` in `app/globals.css` declared `color-scheme: dark;`.
   - On Windows, Chromium defaults to the system's light-mode rendering for any element with `overflow-x: auto`, generating a bright `#ffffff` track with Windows-native arrows and gray thumb.
2. **Missing Custom Scrollbar Styling on `.code__pre`**:
   - `.code__pre` had `overflow-x: auto`, but no `scrollbar-color` or `::-webkit-scrollbar` rules.
   - Without an explicit `background: transparent` track, the browser draws the opaque white system scrollbar over the `#0c0c0f` dark code block.

---

## 3. Decisions & Technical Approach
1. **Set Native `color-scheme`**:
   - Add `color-scheme: dark;` to `:root` (and `color-scheme: light;` under `[data-mode="light"]`) in `app/globals.css`.
   - This ensures all native browser widgets (scrollbars, form controls) default to dark mode.
2. **Custom Sleek Scrollbar on `.code__pre`**:
   - Standards: `scrollbar-width: thin; scrollbar-color: var(--surface-3) transparent;`
   - WebKit:
     ```css
     .code__pre::-webkit-scrollbar {
       height: 6px;
       width: 6px;
     }
     .code__pre::-webkit-scrollbar-track {
       background: transparent;
     }
     .code__pre::-webkit-scrollbar-thumb {
       background-color: var(--surface-3);
       border-radius: var(--r-full);
     }
     .code__pre::-webkit-scrollbar-thumb:hover {
       background-color: var(--border-strong);
     }
     ```
   - Result: Zero white background track. The track is completely transparent, blending seamlessly with the dark code container. A subtle 6px rounded dark gray thumb only shows when scrolling.
3. **Hero `now.ts` Padding & Width Optimization**:
   - Ensure the hero code block doesn't unnecessarily overflow on typical 1080p and laptop screens.

---

## 4. Files to Touch
- `app/globals.css` [MODIFY]

---

## 5. Acceptance Criteria
- [ ] The bright white scrollbar bar at the bottom of the hero code block is completely eliminated.
- [ ] Code block scrollbar track is 100% transparent.
- [ ] When content overflows horizontally, a sleek, thin (6px) rounded dark thumb (`var(--surface-3)`) appears without arrows or white backgrounds.
- [ ] Light mode continues to have appropriate contrast.
- [ ] `npx tsc --noEmit` and `npm run lint` pass with 0 errors.

---

## 6. Manual Verification Steps
1. Open `http://localhost:3000/` in browser on Windows.
2. Inspect the hero code block (`now.ts`):
   - Confirm the white scrollbar bar is gone.
   - Confirm the code block looks clean and seamlessly dark.
3. Visit an article with code blocks (`/articles/building-vertex-a-learning-platform-with-timestamp-search`):
   - Scroll horizontally on any code snippet: confirm the scrollbar track is transparent with a subtle thin dark thumb.
