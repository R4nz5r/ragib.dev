# 06 Newsletter Provider Integration (Resend)

Implementation prompt for wiring the newsletter subscription forms (homepage hero and article footer) to Resend's Audiences API via a secure server route handler, with honeypot anti-spam protection, zero email logging, privacy-preserving duplicate handling, and clean error masking.

---

## Goal

1. **Server Route Handler (`app/api/newsletter/route.ts`)**:
   - Replace the configuration stub with a real server-side call to Resend's Contacts/Audiences API (`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`).
   - Validate the payload with Zod (`email` validated as a valid email string, `honeypot` checked).
   - Read server-only environment variables:
     - `RESEND_API_KEY` (API key from Resend dashboard).
     - `RESEND_AUDIENCE_ID` (Audience ID from Resend dashboard).
     - Strictly no `NEXT_PUBLIC_` prefix.
   - If `RESEND_API_KEY` or `RESEND_AUDIENCE_ID` is missing/unconfigured, return a graceful generic error without crashing.
   - If the honeypot field is populated (bot submission), return `{ success: true }` immediately with HTTP 200 without invoking the provider API.
   - If the email is already subscribed (HTTP 409 Conflict or "already exists" error), return `{ success: true }` so subscriber existence is never disclosed.
   - For other provider failures (e.g. rate limit, bad API key), return a single generic error message (`"Unable to subscribe at this time. Please try again later."`) and never pass raw provider errors or stack traces to the browser.
   - Zero storage or logging of email addresses: no database, no file writes, and no `console.log`/`console.error` containing the user's email address.

2. **Client Newsletter Form (`components/newsletter-form.tsx`)**:
   - Add a hidden honeypot input field (`name="b_name"`, `tabIndex={-1}`, `autoComplete="off"`, `style={{ display: "none" }}`, `aria-hidden="true"`).
   - Include `honeypot` in the JSON payload sent to `/api/newsletter`.
   - Maintain the existing three visual states:
     - **Submitting**: Input disabled, button text `"Subscribing..."`.
     - **Success**: Note displays `"Thanks. Check your inbox to confirm your email."` with `.is-done` accent styling.
     - **Error**: Note displays the generic error message with `.is-error` red styling.
   - Keep forms shared between homepage hero and article footer block.

3. **Environment Documentation (`.env.example`)**:
   - Add `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` with explanatory comments indicating where to locate them in the Resend dashboard.

4. **Static Site Integrity**:
   - Ensure `/api/newsletter` remains the only dynamic route (`ƒ (Dynamic)`), while all 18 content pages, feeds, and sitemaps remain statically generated (`○ (Static)` / `● (SSG)`).

---

## Design Reference & Component States

- **From `design/blog-ui-kit.html` & Components Tab**:
  - Form: `.signup` with `.signup__row` containing `.field` input and `.btn.btn--primary.btn--lg` submit button.
  - Idle note: `.signup__note.t-cap` (hero: "One email a month. Unsubscribe anytime.", article: "Unsubscribe anytime. No tracking.").
  - Success note: `.signup__note.t-cap.is-done` ("Thanks. Check your inbox to confirm your email.").
  - Error note: `.signup__note.t-cap.is-error` (generic user-friendly error message).
- **Honeypot**:
  - Hidden from sighted users and assistive technologies (`display: none`, `aria-hidden="true"`, `tabIndex={-1}`).

---

## Skills & Code Inspected

- **AGENTS.md Section 5**:
  - Newsletter is a single server route forwarding email to the provider. Its key stays on the server.
  - Never cross boundaries: browser holds no secrets and never writes content. Newsletter route is the only server-side write.
- **AGENTS.md Section 7**:
  - Newsletter provider chosen by user (Resend). Build forms and route. Never store addresses in repo or logs.
- **AGENTS.md Section 11**:
  - Provider key is server only and never carries `NEXT_PUBLIC_` prefix. Keep project values in env, and keep a committed `.env.example` as canonical list.
- **Existing Code**:
  - `components/newsletter-form.tsx`: already supports `hideLabel` and `defaultNote`.
  - `app/api/newsletter/route.ts`: stub currently returns `not_configured`.

---

## Decisions & Assumptions

1. **Provider**: Resend Audiences API.
   - Endpoint: `POST https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`
   - Headers: `Authorization: Bearer ${RESEND_API_KEY}`, `Content-Type: application/json`
   - Body: `{ email: normalizedEmail, unsubscribed: false }`
2. **Duplicate Handling**:
   - If Resend returns status 409 (Conflict) or an error response stating the contact already exists, return `{ success: true }`. This prevents user enumeration and protects subscriber privacy.
3. **Honeypot**:
   - If `honeypot` field has any value, simulate instant success without contacting Resend.
4. **Zero Logging Guarantee**:
   - If an error occurs, log only a sanitized message (e.g. `console.error("Resend API returned error status:", res.status)`) with no email address included.
5. **No External SDK**:
   - Use standard native `fetch()` instead of installing `@resend/node` or `resend` package to keep dependencies minimal and avoid unnecessary bundle weight.

---

## Files to Touch / Create

- **`.env.example`**: Add `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` with clear comments.
- **`app/api/newsletter/route.ts`**: Replace stub with Resend API call, Zod validation, honeypot check, duplicate suppression, and sanitized error handling.
- **`components/newsletter-form.tsx`**: Add honeypot state and hidden input.

---

## Requirements

1. **Server Route (`/api/newsletter`)**:
   - `POST` request accepting `{ email: string, honeypot?: string }`.
   - Zod validation for valid email address.
   - Honeypot check: if populated, return `{ success: true }` immediately.
   - Server-only environment variables (`RESEND_API_KEY`, `RESEND_AUDIENCE_ID`). If missing, return a generic error.
   - Provider call: `POST https://api.resend.com/audiences/${audienceId}/contacts` with `unsubscribed: false`.
   - Treat status 409 or duplicate contact as success (`{ success: true }`).
   - Treat other errors as generic failure (`{ error: "..." }`).
   - Zero email logging or persistence.
2. **Client Form (`NewsletterForm`)**:
   - Hidden honeypot field.
   - Submits email and honeypot to `/api/newsletter`.
   - Displays correct success or error note.
3. **Build & Static Analysis**:
   - `npm run build` generates `/api/newsletter` as dynamic (`ƒ`) and all other routes as static.

---

## Security Considerations

- `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` have no `NEXT_PUBLIC_` prefix and are inaccessible to client bundles.
- Honeypot stops automated spambots without disturbing human users or requiring invasive CAPTCHAs.
- Subscriber email addresses are never logged to `stdout`, `stderr`, disk files, or database.
- Duplicate subscriptions return success to prevent bad actors from checking if an email is subscribed.

---

## Acceptance Criteria

- Submitting a valid email when `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` are configured sends a request to Resend.
- When unconfigured or when provider returns error, a generic error message is displayed to the user without leaking internals.
- Submitting with the honeypot field filled returns success without calling Resend.
- Existing subscriber emails return success.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass with 0 errors.

---

## Checks to Run

1. `npx tsc --noEmit`: Type check passes with 0 errors.
2. `npm run lint`: ESLint check passes with 0 errors.
3. `npm run build`: Production build passes; confirms only `/api/newsletter` is dynamic (`ƒ`) and all 18 pages and feeds are static (`○` / `●`).
4. API route testing:
   - `POST /api/newsletter` with invalid email -> returns 400 with validation message.
   - `POST /api/newsletter` with honeypot filled -> returns 200 `{ success: true }`.
   - `POST /api/newsletter` with valid email (unconfigured env) -> returns graceful error message.

---

## Manual Test Steps

1. Test honeypot via curl:
   ```bash
   curl -X POST http://localhost:3000/api/newsletter -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"honeypot\":\"bot\"}"
   ```
   Confirm response is `{"success":true}`.
2. Test invalid email via curl:
   ```bash
   curl -X POST http://localhost:3000/api/newsletter -H "Content-Type: application/json" -d "{\"email\":\"notanemail\"}"
   ```
   Confirm response status is 400 with validation message.
3. Test UI form in browser at `http://localhost:3000/`:
   - Enter invalid email format -> HTML5 browser validation prevents submit.
   - Enter valid email -> button switches to "Subscribing...", then displays state.
4. Test UI form in article footer at `http://localhost:3000/articles/type-safe-route-params`.
