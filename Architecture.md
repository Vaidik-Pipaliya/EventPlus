# Architecture.md — EventPulse

> Note: this is the **event finding and tracking platform** (web app), not the DSA Consistency extension.

## 1. Overview

Three-tier web app with a real-time channel for the chat interface.

```
 ┌──────────────┐   REST (JSON)    ┌─────────────────────┐   HTTPS   ┌──────────────────┐
 │  React SPA   │ ───────────────▶ │  Express API Server │ ────────▶ │ Ticketmaster     │
 │ (Vite, TW)   │ ◀─────────────── │  (Node.js, Mongoose)│ ◀──────── │ Discovery API v2 │
 │              │   Socket.IO (WS) │                     │           └──────────────────┘
 │              │ ◀══════════════▶ │  Chat Gateway       │
 └──────────────┘                  └──────────┬──────────┘
                                              │ Mongoose
                                       ┌──────▼──────┐
                                       │  MongoDB    │
                                       └─────────────┘
```

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind + React Router + TanStack Query | Fast setup, clean server-state handling |
| Real-time | Socket.IO | Chat with auto-reconnect, simple rooms |
| Backend | Node.js 20 + Express | Fast to build, well known |
| DB | MongoDB + Mongoose | Required by spec |
| External | Ticketmaster Discovery API | Required by spec |
| Validation | Zod | Server-side validation |
| Tests | Vitest/Jest + Supertest (core routes only) | Time-boxed |

## 3. Repository Structure (monorepo)

```
eventpulse/
├── README.md  Design.md  Architecture.md  Agents.md  PRD.md
├── .env.example
├── server/
│   ├── package.json
│   └── src/
│       ├── index.js                 # bootstrap: http server + socket attach
│       ├── app.js                   # express app, middleware, route mount
│       ├── config/                  # env.js, db.js
│       ├── models/                  # User, Rsvp, Reminder, ShareLink, ShareClick
│       ├── routes/                  # events, rsvps, users, reminders, share, chat
│       ├── controllers/             # thin: parse req → call service → respond
│       ├── services/                # ALL business logic
│       │   ├── ticketmaster.service.js
│       │   ├── event.service.js
│       │   ├── rsvp.service.js
│       │   ├── share.service.js
│       │   ├── reminder.service.js
│       │   └── chat.service.js      # intent parsing + response building
│       ├── sockets/chat.socket.js
│       ├── middleware/              # userContext, validate, errorHandler, rateLimit
│       ├── validators/              # zod schemas
│       └── utils/                   # cache.js, dates.js, logger.js
└── client/
    ├── package.json
    └── src/
        ├── main.jsx  App.jsx
        ├── api/                     # axios client + per-resource functions
        ├── hooks/                   # useEvents, useRsvps, useChat, useUser
        ├── components/              # EventCard, EventCalendar, ChatPanel, ShareLinkModal, ui/*
        ├── pages/                   # EventsPage, RsvpDashboardPage, ProfilePage, InviteLandingPage
        └── styles/                  # tokens.css, index.css
```

## 4. Data Model (MongoDB)

**User**
```
_id, name, email (unique, lowercase), passwordHash?, provider: 'local'|'google', firebaseUid?, avatarUrl?, city?, createdAt
```
**Rsvp** — unique index `(userId, eventId)`
```
_id, userId, eventId (Ticketmaster id), status: 'going'|'cancelled',
event: { title, venue, startDateTime, url, imageUrl, city }   // snapshot for dashboard
createdAt, updatedAt
```
**Reminder** — unique index `(userId, eventId)`
```
_id, userId, eventId, enabled, remindBefore: '1h'|'1d'|'1w', createdAt
```
**ShareLink**
```
_id, token (unique, nanoid 10), eventId, sharerId (User), createdAt
```
Unique index `(eventId, sharerId)` → one link per sharer per event (idempotent generate).

**ShareClick** — unique index `(shareLinkId, visitorId)`
```
_id, shareLinkId, eventId, visitorId, visitorUserId?, firstClickedAt, clickCount
```
- `visitorId` = anonymous id cookie (set by server on first visit) or userId if known.
- Unique-click logic lives in `share.service.js` using upsert.
- Sharer clicking own link is ignored.

## 5. API Surface (REST, prefix `/api`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register local user `{name, email, password}` |
| POST | `/api/auth/login` | Public | Login local user `{email, password}` |
| POST | `/api/auth/google` | Public | Google login with Firebase idToken `{idToken}` |
| GET | `/api/auth/me` | Required | Get current authenticated user |
| POST | `/api/auth/logout` | Public | Stateless logout |
| PATCH | `/api/users/me` | Required | Update profile fields (name, city) |
| GET | `/api/events` | Optional | Search events: `q, city, from, to, page` |
| GET | `/api/events/calendar` | Optional | `?month=YYYY-MM&city=` → dates with event counts |
| GET | `/api/events/:id` | Optional | Event detail |
| POST | `/api/rsvps` | Required | RSVP (`eventId`) |
| DELETE | `/api/rsvps/:eventId` | Required | Cancel RSVP |
| GET | `/api/rsvps` | Required | RSVP dashboard (upcoming/past) |
| PUT | `/api/reminders/:eventId` | Required | Set/update reminder |
| GET | `/api/reminders` | Required | List reminders |
| POST | `/api/share/:eventId` | Required | Generate/get share link (requires RSVP) |
| GET | `/api/share/:token/click` | Public | Record click, return event + redirect target |
| GET | `/api/share/:eventId/stats` | Required | Sharer's unique click count |
| WS | `chat:message` / `chat:reply` | Required | Real-time chat (JWT in handshake) |

All list-type event responses are **enriched server-side** with `rsvped` (bool for current user) and `friendsAttending` (int).

## 6. Core Flows

### 6.1 Authentication Flow
1. **Local Signup / Login**:
   - Register validates name, email, password (min 8 chars) via Zod.
   - Password hashed with bcrypt (10 salt rounds).
   - Generates JWT with `{ sub: user._id }`, signed with `JWT_SECRET`, 7d expiry.
2. **Google Sign-In**:
   - Client uses Firebase `signInWithPopup(GoogleAuthProvider)` and grabs `idToken`.
   - Server verifies token via `firebase-admin` `auth().verifyIdToken(idToken)`.
   - Upserts User by email (marks provider `'google'` or links existing local account by setting `firebaseUid` and `avatarUrl`).
   - Issues the exact same app JWT.
3. **Session Verification**:
   - `requireAuth` extracts `Bearer <token>`, validates JWT, attaches `req.user`.
   - `optionalAuth` populates `req.user` if valid token present, but does not block guests.

### 6.2 Event Feed
Client → `GET /events` → `event.service` → `ticketmaster.service` (with in-memory TTL cache, 5 min) → normalize to internal `Event` shape → enrich with RSVP state + friendsAttending (single aggregate query, no N+1) → respond.

Normalized Event:
```
{ id, title, venue, city, date, time, startDateTime, imageUrl, url, rsvped, friendsAttending }
```

### 6.3 RSVP
`POST /rsvps` → validate → fetch event (cache) for snapshot → upsert Rsvp (idempotent) → return updated state. Cancelling sets `status:'cancelled'`.

### 6.4 Friend Invite (the "Vibe Check")
1. User RSVPs → card shows **Share** button.
2. `POST /share/:eventId` → server verifies active RSVP → upserts ShareLink → returns `https://app/invite/:token`.
3. Friend opens link → `InviteLandingPage` calls `GET /share/:token/click` → server sets/reads `visitorId` cookie → upserts ShareClick (unique per visitor, ignores sharer) → returns event details. If visitor has valid JWT, also records `visitorUserId`.
4. Event cards for the **sharer** show `friendsAttending = count(unique ShareClick for sharer's links on this event)`.
5. Friend can RSVP from landing page (prompts login if unauthenticated); this tags the click with `visitorUserId`.

### 6.5 Real-time Chat
- Client connects Socket.IO with `auth: { token }` in handshake. Server verifies JWT.
- `chat:message {text}` → `chat.service.parseIntent(text)` → one of:
  `SEARCH_EVENTS {query, city, dateRange}`, `SHOW_RSVPS`, `SET_REMINDER`, `HELP`, `UNKNOWN`.
- Server runs the matching service call and emits `chat:reply {text, events?[]}`.
- `chat:typing` emitted before reply for the typing indicator.
- Intent parsing: rule-based (regex + date keywords like "today", "this weekend", "tomorrow") by default. Optional LLM upgrade behind `CHAT_LLM_ENABLED` env flag; falls back to rules on failure.
- When an RSVP changes via REST, server emits `rsvp:updated` to that user's room so open tabs stay in sync.

### 6.6 Reminders
Settings are persisted (spec requires persistence only). A lightweight in-app scheduler or query checks enabled reminders. Delivery channels beyond in-app are out of scope.

## 7. Cross-Cutting Concerns

- **Auth model:** Dual auth (Firebase Google + MongoDB local bcrypt password) with unified 7-day JWT. Rate-limited to 10 req/min/IP on `/api/auth/*`.
- **Validation:** Zod schema per route; 400 with `{error:{code,message,details}}`.
- **Error format:** consistent JSON; central `errorHandler`.
- **Config:** `.env` — `PORT, MONGO_URI, JWT_SECRET, CLIENT_URL, TICKETMASTER_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY`.
- **Security:** `helmet`, CORS restricted to `CLIENT_URL`, rate limit on `/share/*/click`, `/chat`, and `/api/auth/*`.
- **Resilience:** Ticketmaster failure → return cached data if present, else 502 with friendly message; UI shows retry.
- **Server-side rule:** counts, dedupe, date filtering, intent parsing, and enrichment all happen on the server.

## 8. Deployment (optional if time allows)
Client → Vercel/Netlify. Server → Render/Railway. DB → MongoDB Atlas free tier. Only needed if the submission asks for a live URL; the mandatory deliverable is the public GitHub repo.
