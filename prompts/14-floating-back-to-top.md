# Implementation Prompt: Floating Back-To-Top & Mobile Footer Optimization

## 1. Goal
Improve the mobile Back-to-Top experience by replacing the bulky static button in the mobile footer with a sleek, floating back-to-top action button in the bottom-right corner that dynamically fades in after the reader scrolls down (> 300px). Keep the desktop footer button intact as specified in `design/blog-ui-kit.html`.

---

## 2. Background & Industry Analysis
1. **The Mobile Problem**:
   - In `design/blog-ui-kit.html`, the mobile footer used `flex-direction: column-reverse`, which stacked a full 32px outline button above the copyright text. On small screens (320px–390px), this button dominates the bottom of the viewport, taking up unnecessary vertical space.
   - Furthermore, in long technical articles (2,000–4,000 words), readers must scroll all the way to the very bottom of the page just to find the back-to-top button.
2. **Professional Tech Blog Patterns (Stripe, GitHub Docs, Vercel)**:
   - Modern documentation and engineering blogs use a **Floating Action Button (FAB)** fixed to the bottom-right corner.
   - The button remains invisible at the top of the page and smoothly fades in once the reader scrolls past the initial viewport threshold (~300px).
   - This provides instant, one-tap navigation back to the top/header from any section of an article.

---

## 3. Decisions & Technical Approach
1. **Create `FloatingBackToTop` component** (`components/floating-back-to-top.tsx`):
   - Client component with a passive `scroll` listener (using `requestAnimationFrame` for high 60fps performance).
   - Only appears when `window.scrollY > 300`.
   - Smoothly scrolls to top (`window.scrollTo({ top: 0, behavior: 'smooth' })`).
   - Styled using project tokens:
     - Fixed positioning: `fixed bottom-5 right-5 z-40` with `bottom: calc(20px + env(safe-area-inset-bottom, 0px))` for mobile safe areas (e.g. iPhone home bar).
     - Dimensions: 40px × 40px circular button (`rounded-full`), `border border-border-strong`, `bg-surface/85 backdrop-blur-md`.
     - Icon: Centered `arr-up` icon (18px).
     - Interactive states: Hover border `var(--accent-line)`, hover background `var(--surface-2)`, active press `translate-y-px`.
     - Transitions: `transition-all duration-200`, `opacity-0 pointer-events-none translate-y-2` when hidden; `opacity-100 pointer-events-auto translate-y-0` when visible.
     - Accessible: `aria-label="Back to top"`, hidden from screen reader tab order when invisible (`tabIndex={isVisible ? 0 : -1}`).
2. **Clean Mobile Footer**:
   - In `components/site-footer.tsx`, add `hidden md:inline-flex` to the static footer `BackToTopButton` (or style `.mobile-footer .ftr-bar button { display: none; }` in CSS).
   - The mobile footer bottom bar will now display the copyright notice cleanly without being cluttered by a large stacked button.
   - On desktop, the static footer button remains visible in `.ftr-bar` as per `design/blog-ui-kit.html`.
3. **Mount in Layout/Footer**:
   - Include `<FloatingBackToTop />` in `components/site-footer.tsx` so it is present across all pages.

---

## 4. Files to Touch
- `components/floating-back-to-top.tsx` [NEW]
- `components/site-footer.tsx` [MODIFY]
- `app/globals.css` [MODIFY] (mobile footer bar alignment & floating button styles)

---

## 5. Acceptance Criteria
- [ ] On mobile (< 720px), the bulky static button above the copyright text in the footer is gone. The copyright text renders cleanly.
- [ ] On desktop (> 720px), the static footer button remains visible next to the copyright text.
- [ ] When scrolling down any page (homepage, article, archive) past 300px, a sleek floating icon button appears in the bottom-right corner.
- [ ] When scrolling back near the top (< 300px), the floating icon smoothly fades out.
- [ ] Tapping the floating button smoothly scrolls the page to the top.
- [ ] Works with iOS/Android safe area insets (`env(safe-area-inset-bottom)`).
- [ ] Respects reduced motion preferences (`prefers-reduced-motion`).
- [ ] `npx tsc --noEmit` and `npm run lint` pass with 0 errors.

---

## 6. Manual Verification Steps
1. Open `http://localhost:3000` in mobile view (320px and 390px).
2. Scroll to the footer: Verify the bulky static button is gone and the copyright text looks clean.
3. Scroll down the page past 300px: Verify the floating `↑` button fades in smoothly at the bottom-right.
4. Tap the floating button: Verify it scrolls smoothly to the top and fades out.
5. Open desktop view (1440px): Verify the desktop footer has the static `Back to top` button as designed.
