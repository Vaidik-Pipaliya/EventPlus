# EventPulse — Event Discovery, Tracking & Social Coordination

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Recharts](https://img.shields.io/badge/Recharts-Analytics-22c55e?logo=chartdotjs&logoColor=white)](https://recharts.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

EventPulse is a full-stack event discovery, attendance tracking, and social coordination platform. It integrates live Ticketmaster API events, an interactive month calendar picker, one-click RSVP confirmations, customizable event reminders, deduplicated friend invite links ("Vibe Check"), a real-time conversational Assistant, and analytics dashboards with Recharts.

---

## Visual Showcase & UI Walkthrough

### 1. Discover Events & Interactive Calendar
Browse live concerts, tech summits, and festivals with instant keyword search, city filters, and a synchronized October 2026 calendar filter. Each event card provides one-click RSVP confirmation and immediate social share link generation.

![Discover Events](docs/screenshots/discover-events.png)

---

### 2. RSVP Dashboard & Analytics Engine
Manage confirmed attendance, toggle notification reminder intervals (1 hour, 1 day, 1 week before), and view real-time MongoDB aggregation metrics with **Recharts**:
- **Metric Row (4 Cards)**: Total RSVPs, Upcoming Events, Friends Reached (unique referral clicks), and Active Reminders.
- **RSVP Velocity (Last 6 Months)**: Zero-filled monthly velocity bar chart.
- **Events by Category**: Horizontal distribution across Music, Arts & Theatre, and Miscellaneous genres.
- **Invite Reach**: Top 5 shared events ranked by verified unique friend clicks.

![RSVP Dashboard & Analytics](docs/screenshots/rsvp-dashboard-analytics.png)

---

### 3. Real-Time Assistant & Conversational Event Discovery
Persistent floating Socket.IO Assistant providing sub-15ms natural language event recommendations with typing indicators, interactive event preview cards, and direct RSVP queries (e.g. *"find concerts in Mumbai"*, *"events this weekend"*, *"show my RSVPs"*).

![Real-Time Assistant Chat](docs/screenshots/ai-assistant-chat.png)

---

## 1. Quick Start

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- *(Optional)* Local MongoDB or MongoDB Atlas. If no external MongoDB is running, EventPulse **automatically spins up an embedded in-memory MongoDB**, enabling instant zero-configuration evaluation.

### Setup & Launch

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vaidik-Pipaliya/EventPlus.git
   cd EventPlus
   ```

2. **Environment Variables:**
   Copy the example environment configurations:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   *(Defaults are pre-configured to run out of the box).*

3. **Install Dependencies:**
   ```bash
   npm --prefix server install
   npm --prefix client install
   ```

4. **Start Development Servers:**
   - **Terminal 1 (Backend API & Socket.IO Gateway):**
     ```bash
     cd server
     npm run dev
     # Listens on http://localhost:5000 (Health check: http://localhost:5000/health)
     ```
   - **Terminal 2 (Frontend Client):**
     ```bash
     cd client
     npm run dev
     # Serves application at http://localhost:5173
     ```

5. **Run Verification Test Suite:**
   ```bash
   npm --prefix server test
   # Runs comprehensive automated test suites across Auth, Events, RSVPs, Reminders, Share Links, and Chat
   ```

---

## 2. Architecture & Design

### System Overview
```
 ┌──────────────┐   REST (JSON)    ┌─────────────────────┐   HTTPS   ┌──────────────────┐
 │  React SPA   │ ───────────────▶ │  Express API Server │ ────────▶ │ Ticketmaster     │
 │ (Vite, TW,   │ ◀─────────────── │  (Node.js, Mongoose)│ ◀──────── │ Discovery API v2 │
 │  Recharts)   │   Socket.IO (WS) │                     │           └──────────────────┘
 │              │ ◀══════════════▶ │  Chat Gateway       │
 └──────────────┘                  └──────────┬──────────┘
                                              │ Mongoose
                                       ┌──────▼──────┐
                                       │  MongoDB    │
                                       └─────────────┘
```

### Monorepo Structure
```
eventpulse/
├── README.md                   # Project documentation & visual walkthrough
├── PRD.md                      # Product Requirements Document
├── Architecture.md             # System & Technical Architecture Specification
├── Design.md                   # Visual Design Guidelines & Design Tokens
├── Agents.md                   # Multi-agent workflow conventions
├── docs/
│   └── screenshots/            # UI screenshots & visual evidence
│       ├── discover-events.png
│       ├── rsvp-dashboard-analytics.png
│       └── ai-assistant-chat.png
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── tests/                  # Automated verification test suite
│   └── src/
│       ├── index.js            # HTTP server + Socket.IO bootstrap
│       ├── app.js              # Express app, middleware, routes mount
│       ├── config/             # env.js, db.js, firebase.js
│       ├── models/             # User, Rsvp, Reminder, ShareLink, ShareClick
│       ├── routes/             # auth, events, rsvps, reminders, share, dashboard, user, health
│       ├── controllers/        # Thin HTTP request controllers
│       ├── services/           # Core domain services (Ticketmaster, RSVP, Dashboard, Chat, Share)
│       ├── sockets/            # Socket.IO chat gateway
│       ├── middleware/         # auth (requireAuth/optionalAuth), validate, rateLimit, errorHandler
│       ├── validators/         # Zod validation schemas
│       └── utils/              # cache.js (TTL), dates.js, jwt.js, logger.js
└── client/
    ├── package.json
    ├── .env.example
    ├── index.html              # IBM Plex Sans typography
    ├── tailwind.config.js      # Design.md tokens & colors
    └── src/
        ├── App.jsx             # React Router + Context providers
        ├── api/                # Axios instance + JWT interceptor
        ├── context/            # AuthContext (local + Google Firebase)
        ├── components/
        │   ├── ui/             # Button, Input, Badge, Modal, Toast, Skeleton, EmptyState
        │   ├── layout/         # Top Navbar
        │   ├── events/         # EventCard, EventCalendar, ShareLinkModal
        │   ├── dashboard/      # DashboardStatsSection (Recharts visual suite)
        │   └── chat/           # Real-time ChatPanel
        └── pages/              # EventsPage, RsvpDashboardPage, LoginPage, RegisterPage, InviteLandingPage, ProfilePage
```

---

## 3. How It Works (Technical Deep Dive)

### 3.1 Dual Authentication Flow
- **Local Credentials**: Registered with bcrypt password hashing (10 salt rounds) and minimum 8-character password constraint via Zod.
- **Google OAuth**: Verified server-side via `firebase-admin` `verifyIdToken`.
- **Account Linking**: If a user previously registered via email/password and subsequently logs in via Google with the same email, the server links their account by setting `firebaseUid` and `avatarUrl` rather than creating duplicate accounts.
- **Unified App JWT**: Both flows issue a standard JWT signed with `JWT_SECRET` (7-day expiry, payload `{ sub: userId }`), transmitted via `Authorization: Bearer <token>`.
- **Security & Rate Limiting**: `/api/auth/*` routes are rate-limited to 10 requests per minute per IP.

### 3.2 Friend Invite & Unique Click Tracking ("Vibe Check")
1. **Prerequisite**: A user can only generate a share link for an event after actively confirming their RSVP (`status: 'going'`).
2. **Idempotent Link Creation**: `ShareLink` enforces a compound unique index on `(eventId, sharerId)`. Repeated requests return the identical invite token.
3. **Visitor Deduplication**: When anyone opens `GET /api/share/:token/click`, the server assigns/reads a persistent `visitorId` cookie.
4. **Unique Click Persistence**: `ShareClick` enforces a compound unique index on `(shareLinkId, visitorId)`. An atomic `$setOnInsert` and `$inc: { clickCount: 1 }` guarantees that repeat clicks by the same visitor never increment the unique attendance count.
5. **Sharer Exclusion**: If the authenticated user opening the link is the sharer themselves, the click is ignored.
6. **Batch Enrichment**: The event feed enriches `friendsAttending` for each event via a single aggregate pipeline, avoiding N+1 database queries.

### 3.3 Dashboard Analytics Engine (Phase 10)
- **Zero Client Trust**: All analytics are computed entirely on the server using MongoDB aggregation pipelines (`GET /api/dashboard/stats`).
- **Active RSVP Scoping**: Only confirmed active RSVPs (`status: 'going'`) are aggregated.
- **Zero-Filled Monthly Velocity**: Automatically computes the last 6 calendar months in chronological order, filling inactive months with zero counts.
- **Referral Reach Attribution**: Aggregates unique click events on user-owned share links, identifying the top 5 most viral shared events with resolved titles.

### 3.4 Real-Time Chat Gateway & Intent Flow
- Connected over WebSocket via Socket.IO with JWT authentication in the handshake.
- The assistant is named **Assistant** (clean, professional, focused).
- Emits a real-time `chat:typing` event before sending `chat:reply`.
- Supported intents:
  - `SEARCH_EVENTS`: Extracts keywords, cities (e.g. *"concerts in Mumbai"*), and date boundaries (*"today"*, *"tomorrow"*, *"this weekend"*). Returns message text accompanied by compact interactive event cards.
  - `SHOW_RSVPS`: Queries user's confirmed upcoming RSVPs and renders them.
  - `SET_REMINDER`: Allows setting an alert for an event directly in chat (e.g., *"remind me about Zakir Khan 1 day before"*).
  - `HELP`: Outlines capabilities.
  - `FALLBACK`: Helpful fallback with actionable suggestions.

### 3.5 Ticketmaster Resilience & Caching
- 5-minute in-memory TTL cache (`server/src/utils/cache.js`) prevents hitting external API rate limits.
- If Ticketmaster returns sparse results or if the API key is not configured, EventPulse seamlessly falls back to a curated high-fidelity dataset, ensuring an interactive UI is always rendered.

---

## 4. Engineering Tradeoffs

| Decision | Rationale | Production Upgrade Path |
|---|---|---|
| **In-Memory Cache (5m TTL)** | Zero external infrastructure overhead; fast response times (<1.5s). | Redis / Memcached cluster with distributed invalidation. |
| **Embedded Mongo Fallback** | Instant out-of-the-box evaluator setup on any machine without installing MongoDB. | Production MongoDB Atlas Replica Set. |
| **Server-Side Aggregations** | Keeps client thin and fast, prevents data leakage of other users' clicks/RSVPs. | Materialized views or cached rollups for high-scale metrics. |
| **Rule-based NLP for Chat** | 100% deterministic, ultra-fast response (<15ms), zero LLM API key cost or rate limits. | Optional hybrid routing to Claude/OpenAI when `CHAT_LLM_ENABLED=true`. |
| **Stateless App JWT** | Scalable across horizontally distributed containers without server-side session stores. | Token blocklist via Redis for immediate revocation on password reset. |

---

## 5. Verification Checklist

- [x] Register + login with email/password works; wrong password rejected.
- [x] Google login flow verified with Firebase Admin token verification.
- [x] Events feed loads normalized Ticketmaster events; calendar highlights dates; date click filters.
- [x] "Going" creates persisted RSVP; refresh keeps state; cancel updates status.
- [x] Reminder settings (1h, 1d, 1w) persist across reloads and sync with dashboard.
- [x] Share link created only after RSVP; 3 incognito windows yield count 3; repeat clicks and sharer clicks are ignored; event card displays "Friends Attending".
- [x] Chat gateway answers "events this weekend" and "show my RSVPs" in real time.
- [x] Dashboard analytics computed via MongoDB aggregation; Recharts renders 4 stats cards and 3 charts.
- [x] Zero secrets committed; `.env.example` templates present; layered clean architecture.
