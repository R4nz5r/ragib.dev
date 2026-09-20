# 01b Foundation Follow-up

Implementation prompt for foundation adjustments: nav link filtering with `published` flag, resolution of `@custom-media`, and a dev-only component showcase page at `/dev/components`.

---

## Goal

1. **Nav links**: Add a `published: boolean` property to each nav item in `site.config.ts`. Set all four (`Articles`, `Projects`, `About`, `Uses`) to `true`. Filter navigation items in `SiteHeader` (desktop and mobile) and `SiteFooter` (Sitemap column) so unpublished items are excluded. Ensure `Articles` points to `/` and stays the active item on both the homepage and article pages.
2. **`@custom-media`**: Confirm what compiles `@custom-media --md-nav (min-width: 721px);` in this build, verify the generated CSS output, and replace `--md-nav` with plain media queries (`min-width: 721px` / `max-width: 720px`) across `app/globals.css` to maintain clean, standard CSS.
3. **Dev-only component showcase**: Create `app/dev/components/page.tsx` accessible at `/dev/components` in development only (`notFound()` in production). Render every component state side-by-side matching the Components tab of `design/blog-ui-kit.html`: Button matrix (Primary, Outline, Ghost × Default, Hover, Active, Focus, Disabled), Button sizes and icon variants, ThemeSwitch (On, Off, Live), Pill and Tag states, Kbd, and Field states (Default, Focus, Filled), using design system forced state classes.

---

## Design reference

- `design/blog-ui-kit.html`:
  - Components tab (`#p-components`), lines 662–750.
  - Component CSS rules & forced state classes (`.btn`, `.btn--primary`, `.btn--outline`, `.btn--ghost`, `.is-hover`, `.is-active`, `.is-focus`, `.is-disabled`, `.switch`, `.pill`, `.tag`, `.tag--active`, `.field.is-focus`), lines 181–228.
  - Button matrix layout (`.mx`, `.mx__h`, `.mx__r`) and item container (`.demo`, `.demo__i`, `.demo__c`), lines 98–104.
  - Component generation script, lines 1183–1240.

---

## Technical findings: `@custom-media` compilation

### Investigation
- In `package.json`, the project uses Next.js 16.3.5 and `@tailwindcss/postcss` ^4 with `tailwindcss` ^4.
- Tailwind CSS v4 uses LightningCSS under the hood as its CSS transformation and bundling engine.
- LightningCSS natively implements the CSS Custom Media specification (`@custom-media`).
- Inspecting the generated production CSS bundle in `.next/static/chunks/1qjx3hktj1jmo.css`:
  - `@custom-media --md-nav (min-width: 721px);` was compiled into:
    `@media (min-width:721px){.hidden-desktop,.mobile-nav{display:none!important}}`
    and
    `@media (min-width:721px){.desktop-nav{display:flex}}`
  - There is zero trace of `@custom-media` or `--md-nav` in the compiled CSS shipped to browsers.

### Action
Although Tailwind CSS v4's LightningCSS compiles `@custom-media` correctly, to eliminate any potential toolchain fragility or browser incompatibility, we will replace `--md-nav` with plain standard `@media (min-width: 721px)` everywhere in `app/globals.css`.

---

## Requirements

### 1. Nav Links & `published` boolean
- In `site.config.ts`:
  - Define `NavItem` type: `{ label: string; href: string; published: boolean }`.
  - Update `siteConfig.nav` items to include `published: true` for all four items (`Articles`, `Projects`, `About`, `Uses`).
- In `components/site-header.tsx`:
  - Filter `siteConfig.nav.filter((item) => item.published)` for both desktop navigation and mobile navigation drawer.
  - Update active item determination: `Articles` (`href: "/"`) must remain active when `pathname === "/"` OR when viewing an article page (e.g., `/blog/*`, `/posts/*`, or any slug not matching other top-level published pages).
- In `components/site-footer.tsx`:
  - Filter `siteConfig.nav.filter((item) => item.published)` in the Sitemap column.

### 2. Standardize Media Queries in `app/globals.css`
- Remove `@custom-media --md-nav (min-width: 721px);`.
- Replace `@media (--md-nav)` with `@media (min-width: 721px)`.
- Keep existing `@media (max-width: 720px)` blocks intact.
- Add forced state classes matching the design kit:
  - `.btn.is-hover`, `.btn.is-active`, `.btn.is-focus`, `.btn.is-disabled`
  - `.btn--primary.is-hover`, `.btn--primary.is-active`, `.btn--primary.is-focus`, `.btn--primary.is-disabled`
  - `.btn--outline.is-hover`, `.btn--outline.is-active`, `.btn--outline.is-focus`, `.btn--outline.is-disabled`
  - `.btn--ghost.is-hover`, `.btn--ghost.is-active`, `.btn--ghost.is-focus`, `.btn--ghost.is-disabled`
  - `.switch.is-focus`
  - `.pill.is-hover`, `.pill.is-active`, `.pill.is-focus`
  - `.field.is-focus`

### 3. Component Updates for Forced States & Flexibility
- `components/ui/button.tsx`:
  - Add base classes `btn btn--${variant}` so CSS forced-state classes match automatically.
  - Support `forcedState?: "hover" | "active" | "focus" | "disabled"` prop or allow classes `is-hover`, `is-active`, `is-focus`, `is-disabled`.
- `components/ui/pill.tsx`:
  - Include `pill` class on button element.
- `components/ui/field.tsx`:
  - Include `field` class on label container.
- `components/ui/theme-switch.tsx`:
  - Support optional props `checked?: boolean`, `onToggle?: () => void`, `interactive?: boolean` so static preview switches (on/dark and off/light) can be rendered without modifying global theme state.

### 4. Dev-Only Page at `/dev/components`
- Create `app/dev/components/page.tsx`.
- Include production guard:
  ```ts
  import { notFound } from "next/navigation";

  export default function DevComponentsPage() {
    if (process.env.NODE_ENV === "production") {
      notFound();
    }
    // ...
  }
  ```
- Match the layout and sections of the Components tab in `design/blog-ui-kit.html`:
  - **Button**:
    - 5x3 State Matrix: Rows = Primary, Outline, Ghost; Columns = Default, Hover (`is-hover`), Active (`is-active`), Focus (`is-focus`), Disabled (`is-disabled` + `disabled`).
    - Sizes & Icons: Small (32), Medium (40), Large (48), With icon (GitHub), Icon-only (Copy, 40), Small with icon (Back to top, 32).
  - **Theme switch**:
    - On, dark (`checked={true}`, static).
    - Off, light (`checked={false}`, static).
    - Live switch (interactive).
  - **Tag and pill**:
    - Pill, inactive (`pill`).
    - Pill, hover (`pill is-hover`).
    - Pill, active (`pill` with `active={true}` / `aria-pressed="true"`).
    - Pill, focus (`pill is-focus`).
    - Tag, default (`tag`).
    - Tag, active (`tag tag--active` / `variant="active"`).
    - Language badge (`lang`).
    - Shortcut chip (`kbd`).
  - **Search field**:
    - Default (placeholder "Search articles", kbd chip "⌘K").
    - Focus (`field is-focus`).
    - Filled (value "route params").
  - **Kbd**:
    - Standalone keyboard shortcut chips (`⌘K`, `Ctrl K`, `Esc`).

---

## Files to touch

| File | Action | Purpose |
|---|---|---|
| `site.config.ts` | Modify | Add `published: boolean` to nav items |
| `components/site-header.tsx` | Modify | Filter published nav items, ensure Articles active on homepage & articles |
| `components/site-footer.tsx` | Modify | Filter published nav items in Sitemap |
| `app/globals.css` | Modify | Remove `@custom-media`, replace with plain queries, add forced state classes |
| `components/ui/button.tsx` | Modify | Add semantic `btn` classes, ensure forced state compatibility |
| `components/ui/pill.tsx` | Modify | Ensure `pill` class attached |
| `components/ui/field.tsx` | Modify | Ensure `field` class attached |
| `components/ui/theme-switch.tsx` | Modify | Add optional `checked` and `interactive` props for preview |
| `app/dev/components/page.tsx` | New | Dev-only component preview page returning `notFound()` in production |

---

## Security & Architectural Boundaries

- `/dev/components` is strictly protected with `process.env.NODE_ENV === "production"` triggering `notFound()`. It will never be indexed or accessible in production.
- Client/server boundaries are strictly maintained:
  - `app/dev/components/page.tsx` is a Server Component.
  - Interactive elements (like the live theme switch) run in small client boundaries.
- No new external dependencies or packages added.

---

## Acceptance Criteria

1. `site.config.ts` contains `published: true` on all 4 nav items.
2. Setting `published: false` on any item hides it from `SiteHeader` (desktop & mobile) and `SiteFooter`.
3. Navigation item `Articles` remains highlighted as active on `/` and any post route, but not on `/projects`, `/about`, `/uses`, or `/dev/*`.
4. `app/globals.css` has zero occurrences of `@custom-media` or `--md-nav`; standard `@media (min-width: 721px)` is used.
5. In dev mode (`npm run dev`), navigating to `http://localhost:3000/dev/components` renders all component states side-by-side matching the design kit.
6. In a production build (`npm run build`), `/dev/components` returns a 404 via `notFound()`.
7. `npx tsc --noEmit` passes with 0 errors.
8. `npm run lint` passes with 0 errors and 0 warnings.
9. `npm run build` succeeds cleanly.

---

## Checks to run

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Production bundle check: verify no `--md-nav` in generated CSS chunks.

---

## Manual Test Steps

1. Run `npm run dev` and navigate to `http://localhost:3000/dev/components`.
2. Verify all sections:
   - Button 5-state matrix (Default, Hover, Active, Focus, Disabled) across Primary, Outline, and Ghost.
   - Button sizes (sm, md, lg) and icon variants.
   - Theme switch (On/Dark, Off/Light, and Live switch).
   - Pills (inactive, hover, active, focus) and Tags (default, active, lang badge, kbd).
   - Search field (default, focus, filled).
3. Switch theme via the live switch or header switch to confirm both light and dark modes render correctly on `/dev/components`.
4. Navigate to `http://localhost:3000/` and verify Articles is active in the header.
5. Edit `site.config.ts` temporarily to set `published: false` on `Uses`. Verify Uses disappears from desktop header, mobile menu, and footer sitemap. Revert to `true`.
6. Run `npm run build` and run production server `npm run start`. Navigate to `http://localhost:3000/dev/components` and verify it displays the 404 page.
