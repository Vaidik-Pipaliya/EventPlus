# PRD — EventPulse (Event Finder & Tracker)

| | |
|---|---|
| Owner | Vaidik (Vd) |
| Context | Quantiphi Vibe Coding Round — 2:55 PM to 4:45 PM, Oct 1 |
| Status | Build-ready |

## 1. Problem
People struggle to discover local events and keep track of the ones they plan to attend, and they rarely coordinate attendance with friends.

## 2. Goal
Ship a platform where users **find events (via chat or browse), RSVP, track attendance, set reminders, and invite friends**, with a visible social signal ("Friends Attending") on event cards.

## 3. Success Criteria (for the assessment)
- All required spec items working end-to-end.
- Clean public GitHub repo with incremental commits, submitted before 4:45 PM.
- Clean layered architecture; all business logic server-side.
- Developer can explain every part in the viva.

## 4. Users
- **Event seeker**: wants to quickly find things happening this weekend / in their city.
- **Planner**: wants a single place showing all confirmed events and reminders.
- **Inviter / Invitee**: shares an event link; friend opens it and may RSVP.

## 5. Scope

### 5.1 In scope (MUST)
**Frontend**
- F1 Event Calendar: month grid, dates with events highlighted; clicking a date filters events.
- F2 Event Cards: title, venue, date, time, **Interested** button.
- F3 RSVP Dashboard: all confirmed RSVPs (upcoming/past), cancel, reminder toggle.
- F4 Intelligent chat interface with real-time responses.
- F5 Friends Attending count on event card; Share Link UI after RSVP.
- F6 Invite landing page for share links.
- F7 Profile page (name, email, city).

**Backend**
- B1 Event Feed from Ticketmaster API (normalized, cached).
- B2 MongoDB persistence for RSVPs, user profile, reminder settings.
- B3 Friend Invite: generate share link, track unique clicks, expose count.
- B4 WebSocket chat gateway with intent handling.
- B5 Validation and error handling on all routes.

### 5.2 Should have (if time)
- Search box and city filter on the events page.
- `rsvp:updated` socket sync across tabs.
- Reminder due notification via socket.

### 5.3 Out of scope
Payments/ticket purchase, email/SMS delivery, admin panel, native mobile, event creation by users.

## 6. Functional Requirements

### FR0 Authentication & Session Management
- **Local registration & login**: Email + password stored in MongoDB (bcrypt hash, 10 rounds; password min 8 characters).
- **Google OAuth**: Firebase client SDK pop-up verification via `firebase-admin` `auth().verifyIdToken`.
- **Account Linking**: If an email exists with `local` provider and logs in via Google, link the accounts by updating `firebaseUid`.
- **Unified App JWT**: Signed with `JWT_SECRET`, 7-day expiry, payload `{ sub: userId }`, sent in `Authorization: Bearer <token>`.
- **Rate-limiting**: 10 req/min/IP on `/api/auth/*`.
- Endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/google`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`

### FR1 Event discovery
- `GET /api/events` supports `q, city, from, to, page` (`optionalAuth` for guest browsing, enriches RSVP/share if authenticated).
- Response items: `id, title, venue, city, date, time, startDateTime, imageUrl, url, rsvped, friendsAttending`.
- Ticketmaster failure → cached data or friendly error with retry.

### FR2 Calendar
- `GET /api/events/calendar?month=YYYY-MM&city=` → `{date: count}`.
- UI highlights dates with count > 0; selecting a date filters the list.

### FR3 RSVP
- "Interested" creates an RSVP (status `going`), idempotent per user+event (requires authentication).
- Dashboard lists active RSVPs, split Upcoming / Past, with cancel.

### FR4 Reminders
- Per-RSVP setting: enabled + remind before (1h / 1d / 1w), persisted in MongoDB.
- Visible and editable from the dashboard.

### FR5 Profile
- Update name, email, city; stored in MongoDB; city used as default search location.

### FR6 Chat (real-time)
Supported intents (examples):
| User says | Result |
|---|---|
| "events this weekend" | Search with weekend date range, reply with event cards |
| "concerts in Mumbai" | Search keyword + city |
| "show my RSVPs" | Reply with user's confirmed events |
| "remind me about <event> 1 day before" | Sets reminder if RSVP exists |
| "help" | Lists capabilities |
| anything else | Friendly fallback with suggestions |
- Replies delivered over WebSocket with a typing indicator (authenticated via JWT).
- Rule-based parsing by default; optional LLM behind a flag.

### FR7 Friend Invite ("Vibe Check")
1. After RSVP, user clicks **Share** → server generates a unique link for (user, event).
2. Anyone opening the link is counted as **one unique click** (deduped by visitor id; sharer excluded).
3. Event card for the sharer displays **"N friends attending"** equal to unique clicks.
4. Link opens an invite page with event info and an RSVP button (guests prompted to log in to RSVP).
5. Share modal displays the live click count.

## 7. Non-Functional Requirements
- Server-side business logic; thin client.
- Event list responds in under 1.5s for cached queries.
- Layered, readable code; consistent API response/error format.
- Responsive (mobile and desktop); follows Design.md.
- No secrets in the repo; `.env.example` provided.

## 8. Data (summary)
User, Rsvp, Reminder, ShareLink, ShareClick (see Architecture.md for fields and indexes).

## 9. Acceptance Criteria
- [ ] Register + login with email/password works; wrong password is rejected.
- [ ] Google login works and creates/links a user in MongoDB.
- [ ] Feed loads real Ticketmaster events with title, venue, date, time.
- [ ] Calendar highlights dates having events; date click filters list.
- [ ] Interested creates a persisted RSVP; refresh keeps the state.
- [ ] Dashboard shows all RSVPs; cancel works.
- [ ] Reminder setting persists across reloads.
- [ ] Profile saved in MongoDB.
- [ ] Chat answers "events this weekend" and "show my RSVPs" in real time.
- [ ] Share link generated only after RSVP; same sharer+event returns same link.
- [ ] Opening link in 3 different browsers/incognito windows → count 3; repeat click in one → still 3; sharer click → unchanged.
- [ ] Event card shows "Friends Attending" count.
- [ ] Public GitHub repo with meaningful commits.

## 10. Risks and Mitigations
| Risk | Mitigation |
|---|---|
| Ticketmaster has few results for some Indian cities | Configurable country fallback; default to a major city; show friendly empty state |
| API key / rate limit issues | 5-minute cache; read key from env; test the key in first 10 minutes |
| Running out of time | Strict build order; cut "Should have" items first |
| Unique-click bugs | DB unique index + upsert; manual 3-browser test |
| Viva questions on AI-generated code | Comment key services; README "How it works" |

## 11. Time Plan (110 min)
| Time | Task |
|---|---|
| 2:55–3:00 | Read problem statement, confirm scope against this PRD |
| 3:00–3:10 | Scaffold repo, env, Mongo connection, TM key test |
| 3:10–3:30 | Auth, events, calendar, users, RSVPs, reminders (server) |
| 3:30–3:45 | Share link, click tracking, friendsAttending enrichment |
| 3:45–3:55 | Chat gateway and intents |
| 3:55–4:20 | Client: shell, cards, calendar, dashboard, share modal, chat, invite page |
| 4:20–4:35 | End-to-end test, bug fixes, README |
| 4:35–4:40 | Final push, verify repo is public, submit link on Unstop |
| 4:40–4:45 | Buffer. **No commits after 4:45** |

## 12. Open Assumptions
- Authentication supports both Firebase Google popup and local email/password with unified JWT.
- Ticketmaster API key provided via environment variables.
