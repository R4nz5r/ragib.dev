# 10 Fix Share Row Buttons Alignment & Add LinkedIn Icon

Implementation prompt for adding the missing `linkedin` icon to `components/ui/icon.tsx`, adding base `.btn` styles in `app/globals.css`, and refactoring `components/share-row.tsx` to use the unified `Button` component so "Copy link", "Post on X", "LinkedIn", and "Email" render with horizontal alignment, proper borders, and icons.

---

## Goal

1. **Add `linkedin` Icon (`components/ui/icon.tsx`)**:
   - Add SVG path for LinkedIn (`M16 8a6 6 0 0 1 6 6v7h-4v-7...`) matching the existing SVG stroke/fill conventions in `components/ui/icon.tsx`.

2. **Add Base `.btn` CSS Rules (`app/globals.css`)**:
   - Add the missing `.btn`, `.btn--sm`, `.btn--lg`, `.btn--icon`, `.btn--primary`, `.btn--outline`, and `.btn--ghost` base styles from `design/blog-ui-kit.html` (lines 181–200).
   - Ensures any `.btn` element has `display: inline-flex; align-items: center; justify-content: center; gap: var(--s-1);` preventing icons and text from wrapping to separate lines.

3. **Update Share Row Component (`components/share-row.tsx`)**:
   - Refactor buttons in `share__b` to use the project's `<Button>` component (`size="sm"`, `variant="outline"`).
   - Add `<Icon name="linkedin" size={16} />` to the LinkedIn button.
   - Wrap text in `<span>` tags to ensure proper inline alignment with icons.

---

## Design Reference & Component States

- **From `design/blog-ui-kit.html` (lines 181–200, 378, 978–986)**:
  - Button outline small: `height: 32px; padding: 0 var(--s-2); font: 600 13px/18px var(--font-ui); border: 1px solid var(--border-strong); border-radius: var(--r-md); gap: var(--s-1);`
  - `.share__b`: `display: flex; flex-wrap: wrap; gap: var(--s-1);`
  - Icons: 16×16 inline with button text.

---

## Skills & Code Inspected

- **AGENTS.md Section 6**:
  - "Icons: the design uses inline SVG paths. Port them into one icon component. Do not add an icon library."
- **AGENTS.md Section 7**:
  - "Share links are plain links (X, LinkedIn, email) plus a copy link button. No share SDKs."
- **Code Inspected**:
  - `components/ui/icon.tsx`: Missing `linkedin` icon key.
  - `components/share-row.tsx`: Raw `<button className="btn btn--outline btn--sm">` and `<a>` tags with missing LinkedIn icon.
  - `app/globals.css`: `.btn` had forced states but lacked base `.btn` layout rules.

---

## Files to Touch

| File | Operation | Description |
| --- | --- | --- |
| `components/ui/icon.tsx` | Modify | Add `linkedin` SVG icon definition |
| `app/globals.css` | Modify | Add base `.btn`, `.btn--sm`, `.btn--lg`, `.btn--icon`, `.btn--primary`, `.btn--outline`, `.btn--ghost` CSS rules |
| `components/share-row.tsx` | Modify | Use `<Button>` component and add `<Icon name="linkedin" size={16} />` |

---

## Requirements

1. **Visual Alignment**:
   - Each share button ("Copy link", "Post on X", "LinkedIn", "Email") must render as a single horizontal pill/box with 32px height, 1px border (`var(--border-strong)`), and 8px gap (`var(--s-1)`).
   - Icons must be aligned horizontally with their labels.
2. **LinkedIn Icon**:
   - Clean SVG rendering matching the size and stroke width of the other icons.
3. **Copy Link Interaction**:
   - Clicking "Copy link" copies the article URL to the clipboard, toggles the icon to `check`, and updates label to "Copied" for 2 seconds.

---

## Acceptance Criteria

- [ ] Share buttons in article footer render horizontally with proper outline borders and padding.
- [ ] Icons and labels do not break onto separate lines.
- [ ] LinkedIn button displays a crisp LinkedIn SVG icon.
- [ ] `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass with 0 errors.

---

## Checks to Run

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

---

## Manual Test Steps

1. Open `http://localhost:3000/articles/building-popcorn-real-time-synchronized-watch-parties`.
2. Scroll to the bottom of the article to the "Share this post" section.
3. Verify that all four buttons ("Copy link", "Post on X", "LinkedIn", "Email") have:
   - Outline borders with dark surface backgrounds.
   - Icons aligned side-by-side with their text labels on a single line.
   - A visible LinkedIn logo next to "LinkedIn".
4. Click "Copy link" and verify it changes to "Copied" with a checkmark for 2 seconds.
