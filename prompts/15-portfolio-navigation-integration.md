# Implementation Prompt: Cross-Link Portfolio (ragibshahrier.com) Integration

## 1. Goal
Integrate direct cross-linking to the user's primary portfolio (`https://ragibshahrier.com`) throughout `ragib.dev`—including the header navigation (desktop and mobile), the footer columns, and the hero section—so readers can seamlessly navigate between the technical blog and the main portfolio without duplicating content across two websites.

---

## 2. Background & Architecture Decision
1. **Separation of Concerns**:
   - `ragibshahrier.com`: Primary portfolio holding full bio, resume, client work, and contact forms.
   - `ragib.dev`: Focused engineering blog for technical deep dives and code articles.
2. **Eliminate Unnecessary Placeholder Routes**:
   - `site.config.ts` had unpublished placeholder routes (`/projects`, `/about`, `/uses`). Since the portfolio already serves these needs, keeping them as local draft pages creates maintenance overhead.
   - Replacing them with a prominent, elegant external link to `ragibshahrier.com` keeps `ragib.dev` 100% focused on articles while driving high-intent readers to the portfolio.

---

## 3. Decisions & Technical Approach
1. **Update `site.config.ts`**:
   - Add `portfolio: "https://ragibshahrier.com"` to `siteConfig.links`.
   - Update `siteConfig.nav`:
     ```ts
     nav: [
       { label: "Articles", href: "/", published: true },
       {
         label: "Portfolio",
         href: "https://ragibshahrier.com",
         published: true,
         external: true,
       },
     ]
     ```
2. **Update `components/site-header.tsx`**:
   - Handle `external: true` nav items:
     - Render as standard external link (`target="_blank" rel="noopener noreferrer"`).
     - Display a subtle `↗` arrow indicator next to the label.
     - Exclude from active internal route highlighting.
     - Support both desktop navigation and the mobile slide-out menu drawer.
3. **Update `components/site-footer.tsx`**:
   - Add `Portfolio` link into the **Elsewhere** column (linking to `https://ragibshahrier.com` in a new tab).
   - Ensure the **Sitemap** column renders the published nav items cleanly.
4. **Update `components/hero.tsx`**:
   - Add a `Portfolio` button with an external arrow icon into `hero__links` alongside GitHub and X, giving readers immediate access to the portfolio directly from the hero fold.
5. **Add `external` (arrow-up-right) Icon in `components/ui/icon.tsx`**:
   - Clean, lightweight SVG path: `<path d="M7 17L17 7M7 7h10v10" />`.

---

## 4. Files to Touch
- `site.config.ts` [MODIFY]
- `components/ui/icon.tsx` [MODIFY]
- `components/site-header.tsx` [MODIFY]
- `components/site-footer.tsx` [MODIFY]
- `components/hero.tsx` [MODIFY]

---

## 5. Acceptance Criteria
- [ ] Header navigation displays `Articles` and `Portfolio ↗` on both desktop and mobile drawer.
- [ ] Clicking `Portfolio ↗` opens `https://ragibshahrier.com` in a new tab with `rel="noopener noreferrer"`.
- [ ] Active indicator only highlights `Articles` when on blog routes, never on external `Portfolio`.
- [ ] Hero links include a `Portfolio` button leading to `ragibshahrier.com`.
- [ ] Footer "Elsewhere" column includes `Portfolio`.
- [ ] `npx tsc --noEmit` and `npm run lint` pass with 0 errors.

---

## 6. Manual Verification Steps
1. Open `http://localhost:3000/` in browser.
2. In header: Verify `Portfolio ↗` link is present. Click it to verify it opens `https://ragibshahrier.com` in a new tab.
3. In mobile view: Open hamburger menu and verify `Portfolio ↗` is present and functional.
4. In Hero: Verify the `Portfolio` button is present and links to `https://ragibshahrier.com`.
5. In Footer: Verify `Elsewhere` links include `Portfolio`.
