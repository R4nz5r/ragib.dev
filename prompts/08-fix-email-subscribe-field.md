# 08 Fix Email Subscribe Field & Input Styling

Implementation prompt for restoring the missing `.field` base styles in `app/globals.css` to fix the broken layout of the email subscribe box in the hero (and across the site, including the archive search input and article footer newsletter).

---

## Goal

1. **Restore Missing `.field` Base Styles in `app/globals.css`**:
   - The base `.field` container, `.field input`, and `.field input::placeholder` rules from `design/blog-ui-kit.html` were accidentally omitted when constructing the stylesheet. Only forced hover/focus states were present.
   - Without these base rules, `<label className="field">` defaults to inline display with zero height, no border, and no surface background, causing:
     - The SVG mail icon and the `<input>` to break onto separate lines.
     - The input to appear borderless and uncontained.
     - The "Subscribe" button to appear detached and misaligned on the right.
   - Insert the exact CSS rules from `design/blog-ui-kit.html` (lines 222–228) directly above the `.field:hover` forced states in `app/globals.css`.

2. **Verify Shared Usage**:
   - Verify `components/newsletter-form.tsx` in both hero (`components/hero.tsx`) and article footer (`app/articles/[slug]/page.tsx`).
   - Verify that the archive search field in `components/archive.tsx` (`<label className="field c-4">`) also gains proper alignment and styling without regressions.

---

## Design Reference & Component States

- **From `design/blog-ui-kit.html` (lines 222–228, 303–307, 442–444)**:
  ```css
  /* ---------- Field ---------- */
  .field {
    display: flex;
    align-items: center;
    gap: var(--s-1);
    height: 48px;
    padding: 0 var(--s-2);
    border: 1px solid var(--border-strong);
    border-radius: var(--r-md);
    background: var(--surface);
    color: var(--text-3);
    transition: border-color .15s, box-shadow .15s;
  }
  .field input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text);
    font: 400 16px/24px var(--font-ui);
  }
  .field input::placeholder {
    color: var(--text-4);
    opacity: 1;
  }
  .field:hover {
    border-color: var(--text-4);
  }
  .field:focus-within,
  .field.is-focus {
    border-color: var(--accent-text);
    box-shadow: 0 0 0 4px var(--accent-tint);
  }
  ```
- **Desktop (`1440px`) Layout**:
  - `.signup`: flex column, gap `var(--s-1)` (8px), width 100%, max-width 520px.
  - `.signup__row`: flex row, gap `var(--s-1)` (8px), align items normal / stretch.
  - `.signup__row .field`: `flex: 1; min-width: 0; height: 48px;`
  - `.signup__row .btn`: `height: 48px;` (primary button, `btn--lg`).
  - Label: `.t-label` ("Get new posts by email").
  - Note: `.signup__note.t-cap` ("One email a month. Unsubscribe anytime.").
- **Mobile (`390px` / `≤720px`) Layout**:
  - `.signup__row`: flex column, gap `var(--s-1)`.
  - `.signup__row .field`: flex none, width 100%.
  - `.signup__row .btn`: width 100%.

---

## Skills & Code Inspected

- **AGENTS.md Section 3**:
  - "Reproduce the frames exactly: layout, spacing, typography, color, and states, in both themes and both widths."
  - "Port the design tokens into the Tailwind theme once, then use utilities. Every margin, padding, and gap is one of the base 8 tokens, so do not introduce arbitrary pixel values."
- **Code Inspected**:
  - `app/globals.css`: lines 577–585 only defined forced hover/focus states for `.field`, missing base rules.
  - `components/newsletter-form.tsx`: uses `<label className="field">` with `<Icon name="mail" size={20} className="ic--20" />` and `<input type="email" placeholder="you@example.com" />`.
  - `components/hero.tsx`: renders `<NewsletterForm />` below social links.
  - `components/archive.tsx`: renders `<label className="field c-4">` for article search.

---

## Decisions & Assumptions

- Add the canonical `.field` CSS rules directly to `app/globals.css`. This follows the existing project pattern where `.hero`, `.signup`, `.card`, `.code`, `.pill`, and `.btn` classes live in `app/globals.css`.
- Ensure all input properties (flex: 1, transparent background, proper font family and size, placeholder color) are preserved.
- Both dark mode (`--surface: #111113`, `--border-strong: #3f3f46`, `--text: #fafafa`) and light mode (`--surface: #ffffff`, `--border-strong: #d4d4d8`, `--text: #09090b`) automatically render correctly through the CSS variables.

---

## Files to Touch

| File | Operation | Description |
| --- | --- | --- |
| `app/globals.css` | Modify | Add base `.field`, `.field input`, and `.field input::placeholder` CSS rules above `.field:hover` |

---

## Requirements

1. **Visual Alignment**:
   - The mail icon (`size={20}`) and placeholder text `"you@example.com"` must sit vertically centered inside a 48px height rounded pill/rectangle (`border-radius: var(--r-md)`).
   - The input container has background `var(--surface)`, border `1px solid var(--border-strong)`, and text color `var(--text-3)` for the icon and `var(--text)` for typed text.
   - The "Subscribe" button (`btn--primary btn--lg`, height 48px) sits immediately to the right on desktop with an 8px gap (`var(--s-1)`).
2. **Interactive States**:
   - Hovering over the input field transitions the border to `var(--text-4)`.
   - Focusing the input activates `border-color: var(--accent-text)` and focus ring `box-shadow: 0 0 0 4px var(--accent-tint)`.
3. **Responsive Behavior**:
   - At desktop (`>720px`): horizontal row with `.field` occupying available width (`flex: 1`) and "Subscribe" button on the right.
   - At mobile (`≤720px`): `.signup__row` switches to column layout; both the field and button span full width (100%).

---

## Security Considerations

- No security implications; styling change only. The honeypot anti-spam field and API error masking remain intact.

---

## Acceptance Criteria

- [ ] Email subscribe box in hero renders as a cohesive, single-row component on desktop with icon, input, and button aligned at 48px height.
- [ ] No icon wrapping or multi-line collapse inside the input field.
- [ ] Placeholder text is clearly visible in both dark and light modes.
- [ ] Focus-within ring matches the accent color.
- [ ] Mobile view collapses cleanly into stacked full-width controls.
- [ ] Archive search bar (`<label className="field c-4">`) renders properly with the same cohesive style.
- [ ] `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass with 0 errors.

---

## Checks to Run

1. `npx tsc --noEmit` — Type check.
2. `npm run lint` — Lint check.
3. `npm run build` — Static site generation validation.

---

## Manual Test Steps

1. Open `http://localhost:3000` in browser.
2. Observe the hero newsletter section:
   - Check that "Get new posts by email" label is on top.
   - Check that the email input has a distinct background (`#111113`), subtle border (`#3f3f46`), and rounded corners.
   - Check that the envelope icon `✉` is positioned inside the input on the left, vertically aligned with `"you@example.com"`.
   - Check that the "Subscribe" button is directly adjacent to the input with equal 48px height.
3. Click into the email input:
   - Observe the purple accent focus ring (`0 0 0 4px var(--accent-tint)`).
4. Type an email address:
   - Verify text color is crisp white (`#fafafa` in dark mode).
5. Toggle theme switch to light mode:
   - Verify input background shifts to `#ffffff`, border to `#d4d4d8`, and text to dark `#09090b`.
6. Resize browser window to mobile width (<720px):
   - Verify input and button stack vertically at full width.
7. Scroll down to Latest Articles:
   - Verify the search bar ("Search articles") also displays with the proper field container styling, search icon, and `⌘K` badge.
