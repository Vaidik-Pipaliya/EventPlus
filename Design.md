# Design.md — EventPulse UI System (Professional Theme)

Product: **EventPulse** — find events, RSVP, track them, invite friends. Chat-first.
Stack for UI: React + Vite + Tailwind CSS. **Light theme only** (no dark mode, saves time and looks corporate).

## 0. Design Direction (read first)
The UI must look like a polished SaaS product built by a human design team, not an AI demo.
Reference feel: Linear, Stripe Dashboard, Notion Calendar, Eventbrite. Calm, dense, readable.

**Banned (these make a UI look AI-generated):**
- Purple/violet/indigo-to-pink gradients, neon glows, glassmorphism, blur backdrops
- Emojis as icons or decoration, sparkle/magic-wand icons, "✨" anywhere
- Gradient text, gradient buttons, floating blobs, oversized rounded pills everywhere
- Generic hero headlines ("Discover amazing events!"), lorem-style marketing copy
- Heavy drop shadows, 3D effects, excessive animation, centered everything
- Stock "robot/AI" imagery. The chat assistant is named plainly **"Assistant"**.

**Do:** flat surfaces, 1px borders, restrained single accent color, real-sounding copy, consistent 8px grid, left-aligned content, subtle hover states, clear hierarchy.

## 1. Colors (Tailwind tokens / CSS variables)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F6F7F9` | App background |
| `--surface` | `#FFFFFF` | Cards, panels, modals |
| `--surface-muted` | `#EEF1F5` | Inputs, hover rows, bot chat bubble |
| `--border` | `#DDE2E9` | All borders and dividers |
| `--text` | `#14181F` | Primary text |
| `--text-muted` | `#5B6676` | Secondary text, metadata |
| `--primary` | `#1D4E89` | Primary buttons, links, active nav, selected date |
| `--primary-hover` | `#163D6D` | Primary hover |
| `--primary-soft` | `#E6EEF8` | Selected/active backgrounds, friend badge bg |
| `--success` | `#1E7F5C` | Confirmed RSVP ("Going") |
| `--success-soft` | `#E4F3EC` | Success badge bg |
| `--warning` | `#B26A00` | Reminder indicators |
| `--danger` | `#B42318` | Errors, cancel RSVP |

Rules:
- One accent only: deep blue `--primary`. Green is reserved for confirmed state.
- Text contrast at least 4.5:1. No pure black (`#000`) text.
- Calendar event marker = small `--primary` dot; today = 1px `--primary` outline; selected = `--primary` fill with white text.
- Never rely on color alone; pair with text or icon.

## 2. Typography
- Font: **IBM Plex Sans** (Google Fonts), fallback `system-ui, sans-serif`. Optional mono for IDs: IBM Plex Mono.
- Scale:

| Role | Size / Weight / Line height |
|---|---|
| Page title (H1) | 26px / 600 / 34px |
| Section (H2) | 20px / 600 / 28px |
| Card title (H3) | 16px / 600 / 24px |
| Body | 14px / 400 / 22px |
| Meta / caption | 12.5px / 400 / 18px |
| Button / label | 14px / 500 / 20px |

- Sentence case everywhere (no ALL CAPS except tiny table headers at 12px, letter-spacing 0.04em).
- Card titles clamp to 2 lines. Metadata in `--text-muted`.

## 3. Spacing, Layout, Surfaces
- 4px base; allowed steps: 4, 8, 12, 16, 24, 32, 48.
- Page padding 16 / 24 / 32 (mobile / tablet / desktop). Max width 1280px.
- Card padding 16px; gap between cards 16px.
- Radius: **6px** inputs/buttons, **10px** cards/modals, 999px only for small badges.
- Elevation: cards use `1px solid var(--border)` and no shadow. Modals/popovers only: `0 8px 24px rgba(20,24,31,0.12)`.
- Breakpoints: sm 640, md 768, lg 1024.

### Desktop layout
```
┌───────── Top bar: logo | Events | My RSVPs | Profile | user menu ─────────┐
│ Sidebar (300px): month calendar + filters │ Main: event card grid          │
│                                           │ Chat: right panel (360px, toggle)│
└───────────────────────────────────────────────────────────────────────────┘
```
Mobile: one column; calendar collapses to a week strip; chat opens as a full-screen sheet from a bottom-right button.

## 4. Components

### EventCard
- Image (16:9, 6px radius top, neutral `--surface-muted` placeholder) → title → venue → date • time → footer.
- Fields: title, venue, date, time, **Interested** button, **Friends Attending** indicator when count > 0.
- Button states: default `Interested` (primary outline), active `Going` (success-soft bg, success text, check icon), loading (spinner), disabled.
- Friends Attending: small badge, `--primary-soft` bg, `--primary` text, users icon, text "3 friends attending".
- Share button (secondary, icon + "Share") appears only after RSVP.

### EventCalendar
- Month grid Mon–Sun, 36px cells, prev/next icon buttons, month label in H3.
- Dots under dates that have events (max 3 dots, then "+").
- Click date toggles filter; a "Clear filter" text button appears when active.

### RSVP Dashboard
- Tabs: Upcoming | Past (underline style).
- Table-style rows (title, date/time, venue, reminder select, share, cancel). Cards on mobile.
- Empty state: simple line icon, "You have no RSVPs yet", button "Browse events".

### ChatPanel
- Header: "Assistant" + connection status dot (green/amber) and text.
- User bubble: `--primary` bg, white text, 10px radius. Assistant bubble: `--surface-muted` bg, `--text`.
- Compact event cards inside replies. Typing indicator = three subtle dots.
- Input: single-line field with send icon button; Enter to send.
- Empty state: 3 quiet suggestion buttons ("Events this weekend", "Show my RSVPs", "Concerts near me"), outline style.

### Auth screens (/login, /register)
- Centered 400px card on `--bg`. Logo, H2 "Sign in", email + password fields, primary "Sign in" button, divider "or", outlined "Continue with Google" button (official Google "G" logo), link to register.
- Inline field errors in `--danger`, 12.5px.

### ShareLinkModal
- Read-only input with URL, "Copy link" button (toast "Link copied"), line "12 people opened this link".

### Primitives
Button (primary / secondary / ghost / danger), Badge, Modal, Toast, Skeleton, EmptyState, Tabs, Input, Select, Spinner.
Inputs: 40px height, `--surface` bg, 1px `--border`, focus ring 2px `--primary` at 30% opacity + border `--primary`.

## 5. UI Rules
1. Every async view has loading (skeleton), empty, and error (with retry) states.
2. Frontend renders only; counts, filtering, dedupe, validation live on the server.
3. Disable buttons during in-flight requests; optimistic update only for Interested, with rollback on failure.
4. Dates in local timezone: `Sat, 12 Oct · 7:30 PM`.
5. Icons: lucide-react only, 16–18px, 1.5 stroke. No emoji.
6. Toasts: bottom-center, 3s, one at a time.
7. Motion: 120–160ms ease-out on hover/focus only; respect `prefers-reduced-motion`.
8. Keyboard focus always visible; images have `alt`.
9. Copy tone: plain and specific ("No events found for 12 Oct" not "Oops! Nothing here yet 😢").
10. Use Tailwind utilities mapped to the tokens above; no inline styles except dynamic values.