# Implementation Prompt: Open Portfolio in Same Tab (No New Tab)

## 1. Goal
Ensure clicking **Portfolio** across the entire site (header desktop & mobile navigation, hero section button, and footer links) navigates directly in the same tab instead of spawning a new browser tab (`target="_blank"`).

---

## 2. Background & UX Assessment
1. **Unified Personal Ecosystem**:
   - `ragib.dev` (the technical blog) and `ragibshahrier.com` (the primary portfolio) are two facets of the exact same personal brand (Ragib Shahrier).
   - When a reader clicks "Portfolio" in the main navigation, they are moving between two sections of the author's work, not navigating away to an external third-party service like Twitter or GitHub.
2. **Browser Navigation & Usability (Back Button)**:
   - Forcing `target="_blank"` breaks the natural browser history flow and disables the browser's Back button for returning to the blog.
   - On mobile browsers (Safari, Chrome iOS/Android), `target="_blank"` litters the browser with extra open tabs and creates a disjointed experience.
   - Power users who desire a new tab can always `Cmd/Ctrl + click` or middle-click. Removing `target="_blank"` returns full agency to the user.
3. **Accessibility Standards (WCAG 3.2.5)**:
   - Web Content Accessibility Guidelines (WCAG) recommend avoiding opening new windows/tabs without explicit user intent, as it can disorient assistive technology users.

---

## 3. Decisions & Technical Approach
1. **`site.config.ts`**:
   - In `siteConfig.nav`, keep `{ label: "Portfolio", href: "https://ragibshahrier.com", published: true }`.
   - Update nav item typing to support an optional `newTab?: boolean` (defaulting to `false`), or configure `external: true` without forcing `_blank`.
2. **`components/site-header.tsx`**:
   - In desktop and mobile navigation links:
     - Remove `target="_blank"` and `rel="noopener noreferrer"` for Portfolio nav links.
     - Keep active state handling clean (it still doesn't falsely highlight on local blog sub-paths).
     - Keep or refine the subtle `↗` arrow indicator next to Portfolio based on preference (or retain as a gentle hint that the URL switches domains).
3. **`components/hero.tsx`**:
   - For the `Portfolio` button:
     - Remove `target="_blank"` and `rel="noopener noreferrer"`.
     - Clicking the Hero Portfolio button now navigates directly in the same tab.
     - Note: Third-party social links (`GitHub`, `Twitter/X`) remain `target="_blank"` as they lead off-domain to third-party platforms.
4. **`components/site-footer.tsx`**:
   - In the Navigation / Sitemap column:
     - Render nav items without `target="_blank"`.
   - In the "Elsewhere" column:
     - Update the `Portfolio` link to navigate in the same tab (no `target="_blank"`).
     - External social links (`GitHub`, `X`) remain `target="_blank"`.

---

## 4. Files to Touch
- `site.config.ts` [MODIFY]
- `components/site-header.tsx` [MODIFY]
- `components/hero.tsx` [MODIFY]
- `components/site-footer.tsx` [MODIFY]

---

## 5. Acceptance Criteria
- [ ] Clicking `Portfolio` in desktop header navigation opens `https://ragibshahrier.com` in the same tab.
- [ ] Clicking `Portfolio` in mobile header drawer navigation opens `https://ragibshahrier.com` in the same tab.
- [ ] Clicking `Portfolio` button in the Hero section opens `https://ragibshahrier.com` in the same tab.
- [ ] Clicking `Portfolio` in the Footer (both nav list and Elsewhere) opens in the same tab.
- [ ] Third-party external links (`GitHub`, `Twitter/X`) still open in a new tab (`target="_blank"`).
- [ ] `npx tsc --noEmit` and `npm run lint` pass with 0 errors.

---

## 6. Manual Verification Steps
1. Navigate to `http://localhost:3000/`.
2. Click `Portfolio` in the header: verify the current tab navigates to `https://ragibshahrier.com` (no new tab is created). Press browser "Back" and verify returning to `ragib.dev`.
3. Open mobile menu drawer: click `Portfolio`: verify it navigates in the same tab.
4. In Hero: click the `Portfolio` button: verify same-tab navigation. Click `GitHub` and verify it still opens in a new tab.
5. In Footer: click `Portfolio` in Elsewhere: verify same-tab navigation.
