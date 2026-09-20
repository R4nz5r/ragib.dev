# 01 Foundation

Set up the project foundation: design tokens, fonts, theme persistence, shared UI components, site header and footer, and site config. No pages beyond a placeholder home route.

---

## Goal

Port the design system from `design/blog-ui-kit.html` into a working Next.js + Tailwind v4 foundation so that every future page and component can import tokens, UI primitives, and the site shell without reinventing anything.

---

## Design reference

All values below come from the `.ds` scope in the design file (lines 110–136), the type scale (lines 148–159), layout primitives (lines 162–175), and the component classes (lines 180–275). The header template is at lines 795–820, footer at lines 822–852.

---

## 1. Design tokens → Tailwind v4 `@theme`

Tailwind v4 uses `@theme inline { ... }` inside the CSS file to register custom theme values. No `tailwind.config.ts` is needed.

### Colors (CSS custom properties on `:root`, overridden by `[data-mode="light"]`)

**Dark (default on `:root`)**

| Token | Value |
|---|---|
| `--bg` | `#09090b` |
| `--surface` | `#111113` |
| `--surface-2` | `#18181b` |
| `--surface-3` | `#27272a` |
| `--border` | `#27272a` |
| `--border-strong` | `#3f3f46` |
| `--text` | `#fafafa` |
| `--text-2` | `#d4d4d8` |
| `--text-3` | `#a1a1aa` |
| `--text-4` | `#84848e` |
| `--accent` | `#6d4aff` |
| `--accent-hover` | `#5b37f2` |
| `--accent-press` | `#4a28d0` |
| `--accent-text` | `#a794ff` |
| `--accent-tint` | `rgba(124,92,255,.14)` |
| `--accent-line` | `rgba(151,124,255,.55)` |
| `--on-accent` | `#ffffff` |
| `--info-bg` | `rgba(124,92,255,.10)` |
| `--info-line` | `rgba(151,124,255,.40)` |
| `--info-ic` | `#a794ff` |
| `--warn-bg` | `rgba(245,158,11,.10)` |
| `--warn-line` | `rgba(245,158,11,.40)` |
| `--warn-ic` | `#fbbf24` |
| `--code-bg` | `#0c0c0f` |
| `--code-text` | `#e4e4e7` |
| `--shadow-hover` | `0 8px 24px rgba(0,0,0,.45)` |

Syntax highlighting tokens (`--c-kw`, `--c-str`, `--c-fn`, `--c-ty`, `--c-cm`, `--c-num`, `--c-pn`) are defined but will only be used by the code block component in a later prompt.

**Light overrides (`[data-mode="light"]`)**

| Token | Value |
|---|---|
| `--bg` | `#fafafa` |
| `--surface` | `#ffffff` |
| `--surface-2` | `#f4f4f5` |
| `--surface-3` | `#e4e4e7` |
| `--border` | `#e4e4e7` |
| `--border-strong` | `#d4d4d8` |
| `--text` | `#09090b` |
| `--text-2` | `#3f3f46` |
| `--text-3` | `#52525b` |
| `--text-4` | `#71717a` |
| `--accent-text` | `#5b37f2` |
| `--accent-tint` | `rgba(109,74,255,.08)` |
| `--accent-line` | `rgba(109,74,255,.45)` |
| `--info-bg` | `rgba(109,74,255,.06)` |
| `--info-line` | `rgba(109,74,255,.30)` |
| `--info-ic` | `#5b37f2` |
| `--warn-bg` | `rgba(217,119,6,.08)` |
| `--warn-line` | `rgba(217,119,6,.40)` |
| `--warn-ic` | `#b45309` |
| `--code-bg` | `#f4f4f5` |
| `--code-text` | `#27272a` |
| `--shadow-hover` | `0 8px 24px rgba(24,24,27,.12)` |

Light mode does **not** override `--accent`, `--accent-hover`, `--accent-press`, or `--on-accent` — those stay the same.

### Spacing (base 8)

| Token | px | Tailwind name |
|---|---|---|
| `--s-0` | 4 | `s-0` (the half-step) |
| `--s-1` | 8 | `s-1` |
| `--s-2` | 16 | `s-2` |
| `--s-3` | 24 | `s-3` |
| `--s-4` | 32 | `s-4` |
| `--s-6` | 48 | `s-6` |
| `--s-8` | 64 | `s-8` |

Register these as `--spacing-s-*` values in `@theme` so utilities like `p-s-3`, `gap-s-2`, `mt-s-8` work.

### Radius

| Token | px | Tailwind name |
|---|---|---|
| `--r-sm` | 6 | `r-sm` |
| `--r-md` | 8 | `r-md` |
| `--r-lg` | 12 | `r-lg` |
| `--r-full` | 999px | `r-full` |

Register as `--radius-r-*`.

### Type scale

All use `--font-ui` (Plus Jakarta Sans) except Meta and Code which use `--font-mono` (JetBrains Mono).

| Name | Weight | Size/Leading | Letter spacing | Mobile override |
|---|---|---|---|---|
| H1 | 700 | 40/48 | -0.02em | 32/40 |
| H2 | 700 | 32/40 | -0.015em | 24/32 |
| H3 | 600 | 24/32 | -0.01em | 20/28 |
| Body | 400 | 16/24 | — | — |
| Label | 600 | 14/24 | — | — |
| Prose | 400 | 18/32 | — | mobile 16/24 |
| Caption | 500 | 13/18 | — | — |
| Meta | 500 (mono) | 13/18 | — | — |
| Code | 400 (mono) | 14/24 | — | — |

These will be implemented as utility classes (e.g. `.t-h1`, `.t-h2`) in the CSS, not as Tailwind theme extensions, because Tailwind's `text-*` utility can't encode weight+size+line-height+tracking+font-family in a single token. The classes mirror the design file exactly.

---

## 2. Fonts

Use `next/font/google` to load:
- **Plus Jakarta Sans** — weights 400, 500, 600, 700, 800 — variable `--font-ui`
- **JetBrains Mono** — weights 400, 500, 600, 700 — variable `--font-mono`

Set both CSS variables on `<html>` via the `variable` option. Register them in `@theme` so `font-ui` and `font-mono` utilities work.

Do **not** add any `<link>` tags to Google Fonts.

---

## 3. Theme system

### Requirements
- Dark is the default. The `<html>` element has `data-mode="dark"` by default.
- A `[data-mode="light"]` selector overrides the CSS custom properties.
- The user's choice is saved to `localStorage` key `"theme"`.
- On page load, an inline `<script>` in `<head>` reads `localStorage` and sets `data-mode` **before first paint** to avoid a flash.
- `suppressHydrationWarning` is on `<html>` because the script mutates the attribute before React hydrates.
- The theme is **not** read from cookies or `searchParams`, so the page stays statically generated.

### Implementation
- `app/layout.tsx`: the root layout renders the inline theme script, sets `suppressHydrationWarning` on `<html>`, applies font variables.
- `components/theme-provider.tsx` (`"use client"`): a React context that reads `data-mode` from the DOM on mount, provides `{ mode, toggle }` to children, and writes to both the DOM attribute and `localStorage` on toggle.

---

## 4. Shared UI components

All under `components/ui/`. Each is a `.tsx` file. All use the design tokens via Tailwind utilities and the type-scale utility classes. Every interactive component has all states from the Components tab.

### Icon (`components/ui/icon.tsx`)
- A single component: `<Icon name="search" size={16|20|24} className? />`
- Contains all SVG paths from the design file's `<defs>` block (lines 488–510): `search`, `rss`, `sun`, `moon`, `github`, `x`, `copy`, `check`, `info`, `alert`, `clock`, `calendar`, `refresh`, `chev-r`, `chev-d`, `arr-up`, `arr-l`, `arr-r`, `link`, `menu`, `mail`.
- Renders an inline `<svg>` with `stroke="currentColor"`, `fill="none"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"` — except `i-x` which uses `fill="currentColor"` and no stroke.
- `aria-hidden="true"` by default.

### Button (`components/ui/button.tsx`)
- Props: `variant` (`"primary" | "outline" | "ghost"`), `size` (`"sm" | "md" | "lg"`), `iconOnly?: boolean`, rendered as `<button>` or `<a>` via an `as` prop.
- Heights: sm=32, md=40 (default), lg=48.
- Padding: sm/md = `0 16px`, lg = `0 24px`. Icon-only: width = height, no padding.
- Font: sm = 13/18 600, md = 14/24 600, lg = 16/24 600.
- Radius: 8px.
- Gap: 8px (between icon and label).
- States match the design exactly (hover, active, focus-visible, disabled) using CSS transitions (150ms).
- Focus ring: `outline: 2px solid var(--accent-text); outline-offset: 2px`.

### Pill (`components/ui/pill.tsx`)
- Props: `active?: boolean`, `count?: number`, `children` (label text).
- Height 32, padding 0/16, radius 999, gap 8.
- Label: 14/24 500 font-ui. Count: 13/18 500 font-mono, text-4 color (accent-text when active).
- States: default (border, text-3), hover (border-strong, surface-2, text), active/aria-pressed (accent-text, accent-line border, accent-tint bg), focus-visible.
- Renders `<button>` with `aria-pressed`.

### Tag (`components/ui/tag.tsx`)
- Props: `variant?: "default" | "active"`, `children`.
- Height 24, padding 0/8, radius 6.
- Font: 13/18 500 font-mono.
- Default: surface-2 bg, border, text-3.
- Active: accent-tint bg, accent-line border, accent-text.
- Renders `<span>`.

### Kbd (`components/ui/kbd.tsx`)
- Height 24, padding 0/8, radius 6.
- Font: 13/18 500 font-mono, text-3.
- bg: surface-2, border: border-strong.
- Renders `<kbd>`.

### Field (`components/ui/field.tsx`)
- A search-field wrapper. Props: `icon?: React.ReactNode`, `kbd?: string`, `children` (passes through to `<input>`), and standard input props.
- Height 48, padding 0/16, radius 8, gap 8.
- Border: border-strong. Hover: text-4. Focus-within: accent-text border + 4px accent-tint box-shadow.
- Input: flex-1, transparent bg, text color, 16/24 400, placeholder text-4.

### ThemeSwitch (`components/ui/theme-switch.tsx`)
- `"use client"` — consumes the theme context.
- Track: 56×32, border border-strong, radius 999, surface-2 bg.
- Knob: 24×24, accent bg, on-accent color, positioned 3px from edge, slides 24px via `transform: translateX(24px)`.
- Shows moon icon in dark, sun icon in light.
- `role="switch"`, `aria-checked` reflects dark, `aria-label` updates.
- Focus ring: 2px accent-text outline, 2px offset.

---

## 5. Layout: Header and Footer

### Site Header (`components/site-header.tsx`)
- Sticky at top, z-index 50, height 64px, bg bg, border-bottom border.
- Container: `max-width: 1200px; margin-inline: auto`.
- Left: logo (`//margin` with `//` in accent-text, rest in text, font 700 16/24 mono, tracking -0.03em), then desktop nav.
- Desktop nav: links for Articles (active by default with indicator bar), Projects, About, Uses. Each is a ghost-styled link: 40px height, padding 0/16, radius 8, 14/24 600 font-ui, text-3, hover text + surface-2 bg. Active has `aria-current="page"` + text color + a 2px accent-text bar at the bottom (positioned -12px from the link bottom).
- Right: RSS ghost button (icon + "RSS" label, collapses to icon-only on mobile), ThemeSwitch, hamburger menu button (hidden on desktop, shown ≤720px).
- Mobile nav: hidden by default. When hamburger is toggled, a `<nav>` appears below the header with full-width links (48px height, 16/24 600, border-top separators). Active link has accent-text color.
- On ≤720px: desktop nav hides, hamburger shows, RSS button collapses to icon-only (40px square, label hidden).

### Site Footer (`components/site-footer.tsx`)
- Margin-top s-8, padding s-6 top / s-4 bottom, border-top border.
- 12-column grid inside 1200px container.
- Left col (span 5): logo, description paragraph (16/24, text-3, max-w 360px), social icon links (GitHub, X, RSS) as ghost icon-only buttons.
- Right: two nav columns.
  - "Sitemap" column (grid-column 7 / span 3): h3 heading (14/24 600), links for Articles, Projects, About, Uses (14/24 400, text-3, hover accent-text).
  - "Elsewhere" column (grid-column 10 / span 3): h3, links for GitHub, X, RSS feed, Email.
- Bottom bar: flex row, space-between, margin-top s-6, padding-top s-3, border-top border. Left: copyright (Caption, text-3). Right: "Back to top" outline small button with arr-up icon.
- **Mobile (≤720px)**: footer cols become a 2-column CSS grid. Bottom bar stacks reversed (column-reverse, items start). Reduced padding.

### Root layout (`app/layout.tsx`)
- Wraps `{children}` in `<SiteHeader />` ... `<main>{children}</main>` ... `<SiteFooter />`.
- The `<main>` element has `flex: 1` so the footer is pushed to the bottom.
- Metadata: site title and description from `site.config.ts`.

---

## 6. `site.config.ts`

```ts
export const siteConfig = {
  name: "margin",
  url: "https://margin.dev",
  description: "Notes on TypeScript, Next.js and the architecture behind them.",
  author: {
    name: "Sam Okafor",
    role: "Full-stack developer",
    initials: "SO",
    bio: "Full-stack developer. These are notes on React, Next.js and the architecture decisions behind production apps.",
  },
  links: {
    github: "https://github.com/username",
    x: "https://x.com/username",
    email: "mailto:hello@margin.dev",
    rss: "/feed.xml",
  },
  nav: [
    { label: "Articles", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "About", href: "/about" },
    { label: "Uses", href: "/uses" },
  ],
  tags: [
    "TypeScript",
    "Next.js",
    "CSS Architecture",
    "Architecture",
    "React",
    "Performance",
  ],
  now: {
    role: "Full-stack developer",
    building: "a type-safe CMS on Next.js",
    learning: ["React Compiler", "Postgres RLS"],
    stack: ["TypeScript", "Next.js", "Tailwind"],
    writing: "every other week",
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} Sam Okafor. All rights reserved.`,
  },
} as const;

export type SiteConfig = typeof siteConfig;
```

All names, URLs, and copy are placeholders the user will replace.

---

## 7. Responsive breakpoints

Use CSS media queries (not container queries, since we're in the real app, not the design viewer):
- `≥1248px`: no side padding on container (it's already 1200 centered in a wider viewport).
- `721–1247px`: 24px side padding on the container.
- `≤720px`: 16px side padding, 4-column grid with 16px gutters, heading sizes step down, nav collapses.

---

## 8. Files to create or modify

### New files
| File | Purpose |
|---|---|
| `site.config.ts` | Site-wide configuration |
| `components/theme-provider.tsx` | Client component: theme context + inline script |
| `components/ui/icon.tsx` | SVG icon component |
| `components/ui/button.tsx` | Button (primary, outline, ghost) |
| `components/ui/pill.tsx` | Category filter pill |
| `components/ui/tag.tsx` | Static tag label |
| `components/ui/kbd.tsx` | Keyboard shortcut chip |
| `components/ui/field.tsx` | Search/input field wrapper |
| `components/ui/theme-switch.tsx` | Theme toggle switch |
| `components/site-header.tsx` | Sticky header with nav |
| `components/site-footer.tsx` | Footer with columns |
| `components/ui/index.ts` | Barrel export |
| `.env.example` | Canonical env var list |
| `prompts/01-foundation.md` | This file |

### Modified files
| File | Change |
|---|---|
| `app/globals.css` | Replace with Tailwind v4 theme tokens, type-scale classes, layout utilities |
| `app/layout.tsx` | Replace with Plus Jakarta Sans + JetBrains Mono fonts, theme script, header/footer shell |
| `app/page.tsx` | Replace with a minimal placeholder |

---

## 9. Decisions and assumptions

1. **Tailwind v4**: The project already uses `@tailwindcss/postcss` v4 and the `@import "tailwindcss"` + `@theme inline` pattern. No `tailwind.config.ts` needed.
2. **Theme attribute**: Using `data-mode` on `<html>` (not a class) to match the design file's `[data-mode="light"]` convention.
3. **Button polymorphism**: The Button supports both `<button>` and `<a>` via a polymorphic `as` prop or separate exports.
4. **Nav active state**: Header nav uses `usePathname()` to determine the active link and set `aria-current="page"`. This is a `"use client"` concern isolated to the nav component.
5. **Mobile menu**: Controlled by local state in a client component wrapper. The menu is `display:none` by default and toggled to `display:block`.
6. **Projects, About, Uses**: These pages are out of scope. The nav links point to `/projects`, `/about`, `/uses` which will 404 for now. This is expected per AGENTS.md (those pages have no design yet).

---

## 10. Security considerations

- No secrets used at this stage.
- `.env.example` created with `NEXT_PUBLIC_SITE_URL` as the only entry.
- The theme script reads only from `localStorage`, no external data.

---

## 11. Acceptance criteria

- [ ] `npm run build` succeeds with no errors.
- [ ] `npm run lint` passes.
- [ ] TypeScript compilation passes (`npx tsc --noEmit`).
- [ ] Dev server starts and shows the header, a placeholder page body, and the footer.
- [ ] At 1440px: 12-column grid, desktop nav visible, hamburger hidden.
- [ ] At 390px: 4-column grid, desktop nav hidden, hamburger visible, mobile menu toggles.
- [ ] Theme switch toggles between dark and light. Choice survives a page reload.
- [ ] No flash of wrong theme on reload (the inline script applies `data-mode` before paint).
- [ ] All component files export typed components with the correct props.
- [ ] Colors match the design in both themes.
- [ ] Font: Plus Jakarta Sans for UI text, JetBrains Mono for mono contexts. Loaded via `next/font`, no external requests.
- [ ] `suppressHydrationWarning` is on `<html>`.
- [ ] All spacing, radius, and typography tokens are available as Tailwind utilities.

---

## 12. Checks to run

1. `npx tsc --noEmit` — type check.
2. `npm run lint` — ESLint.
3. `npm run build` — production build (verifies static generation, no dynamic reads).
4. `npm run dev` — visual check at 1440 and 390, both themes.
5. Theme toggle → reload → verify the choice persisted and no flash.
6. Keyboard-tab through the header: logo, nav links, RSS, theme switch, then (on mobile) hamburger.

---

## 13. Manual test steps

1. `npm run dev`, open `localhost:3000`.
2. The page loads in dark mode. Header shows `//margin` logo, nav links (Articles, Projects, About, Uses), RSS button, and theme switch.
3. Click the theme switch — page turns light. Colors match the design's light mode.
4. Reload — still light. No flash of dark then light.
5. Click switch again — dark. Reload — stays dark.
6. Resize to 390px — desktop nav hides, hamburger appears. Click hamburger — mobile nav slides in with the same links. Click again — it closes.
7. Scroll down — footer is visible with the logo, description, social links, Sitemap column, Elsewhere column, copyright bar, and "Back to top" button.
8. Click "Back to top" — scrolls to top.
9. Tab through the page with keyboard — all interactive elements are reachable, focus rings are visible (2px accent outline, 2px offset).
