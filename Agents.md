# Agents.md — Instructions for the AI Coding Agent

Read this file first, then `PRD.md`, `Architecture.md`, `Design.md`. They are the source of truth. If code and docs disagree, follow the docs and flag it.

## 1. What this project is
**EventPulse**: a web platform to find and track events. Chat-first (real-time), calendar, event cards, RSVP dashboard, Ticketmaster feed, MongoDB persistence, and a Friend Invite system (share link + unique click tracking + "Friends Attending" count).
It is built for a **timed assessment (110 minutes, GitHub submission)**. Prefer working, clean, simple over clever.

## 2. Stack (do not change)
- Client: React 18, Vite, Tailwind, React Router, TanStack Query, socket.io-client, lucide-react, firebase (web SDK)
- Server: Node 20, Express, Mongoose, Socket.IO, Zod, firebase-admin, bcryptjs, jsonwebtoken, helmet, cors, express-rate-limit, nanoid, axios, cookie-parser
- DB: MongoDB (local or Atlas). External API: Ticketmaster Discovery v2.
- Language: JavaScript (ES modules). No TypeScript, to save time.

## 3. Non-negotiable rules
1. **All business logic on the server.** Calculations, validation, dedupe, counts, filtering, intent parsing, enrichment live in `server/src/services/`. The client only renders and sends user actions.
2. **Layering:** routes → controllers → services → models. Controllers contain no business logic. Services never touch `req`/`res`.
3. **Never expose the Ticketmaster key, JWT_SECRET, or Firebase credentials to the client.**
4. **Never commit secrets.** Use `.env`; keep `.env.example` updated.
5. **Follow Design.md** tokens, spacing, and component rules. No ad-hoc colors.
6. Every UI data view has loading, empty, and error states.
7. Every route validates input with Zod and returns the standard error shape.
8. Unique-click and idempotent RSVP behavior must be enforced by **DB unique indexes + upserts**, not just by code checks.
9. Avoid N+1 queries; enrich event lists with one aggregate query.
10. Do not add features outside PRD scope. Add to "Future" in the README instead.

## 4. Commands
```
# server
cd server && npm install && npm run dev      # nodemon, port 5000
npm test                                     # core tests

# client
cd client && npm install && npm run dev      # vite, port 5173
```
Env (`server/.env`):
`PORT=5000 MONGO_URI=... JWT_SECRET=... CLIENT_URL=http://localhost:5173 TICKETMASTER_API_KEY=... FIREBASE_PROJECT_ID=... FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY=...`
Env (`client/.env`):
`VITE_API_URL=http://localhost:5000 VITE_FIREBASE_API_KEY=... VITE_FIREBASE_AUTH_DOMAIN=... VITE_FIREBASE_PROJECT_ID=... VITE_FIREBASE_APP_ID=...`

## 5. Conventions
- Files: `camelCase.js` for modules, `PascalCase.jsx` for components, `*.service.js`, `*.controller.js`, `*.routes.js`.
- API JSON: camelCase. Dates: ISO 8601 UTC from server; client formats to local.
- Error shape: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }`
- Success shape: `{ "data": ... }` (lists add `"meta": { page, total }`).
- No `console.log` in committed code; use `utils/logger.js`.
- Keep functions under ~40 lines; extract helpers.
- Comment the **why**, not the what. Short JSDoc on service functions (you will be quizzed on this in the viva).

## 6. Git workflow (graded)
Small, meaningful commits using Conventional Commits:
1. `docs: update auth to firebase google + email/password`
2. `chore: scaffold monorepo`
3. `feat(server): express app, mongo connection, error handling`
4. `feat(server): auth with email/password and google firebase`
5. `feat(server): ticketmaster service with cache and normalization`
6. `feat(server): events search and calendar endpoints`
7. `feat(server): rsvp, reminders, and profile management`
8. `feat(server): share link generation and unique click tracking`
9. `feat(server): enrich events with rsvped and friendsAttending`
10. `feat(server): socket.io chat gateway and intent parsing`
11. `feat(client): design tokens, router, and auth context`
12. `feat(client): event cards, search, and calendar`
13. `feat(client): rsvp dashboard and share modal`
14. `feat(client): real-time chat panel`
15. `feat(client): invite landing page and profile page`
16. `docs: readme, final polish`
Commit after each working step. **No commits after 04:45 PM.** Aim to push final code by 04:30 PM.

## 7. Build order (follow strictly, test each step)
1. Server up + Mongo connected → `GET /health`.
2. Ticketmaster `GET /api/events` returns normalized JSON (verify with curl).
3. Users → RSVPs → Reminders.
4. Share link + click tracking + `friendsAttending` enrichment (verify with two different visitor ids).
5. Chat gateway (rule-based intents).
6. Client: shell → events + calendar → RSVP dashboard → share modal → chat → invite page.
7. README + push.

## 8. Domain notes the agent must get right
- **Friends Attending** = number of **unique visitors** who clicked the current user's share link for that event (sharer's own clicks excluded). Repeat clicks by the same visitor do not increase it.
- A share link can be generated **only after** an active RSVP.
- Event IDs are Ticketmaster IDs (strings). Store an event snapshot on RSVP so the dashboard works even if TM later fails.
- Calendar endpoint returns `{ "2026-10-12": 4, ... }` (date → event count) for the month.
- Ticketmaster endpoint: `https://app.ticketmaster.com/discovery/v2/events.json` with params `apikey, keyword, city, startDateTime, endDateTime, size, page`. Date params must be `YYYY-MM-DDTHH:mm:ssZ`. If India results are sparse, default to a configurable `DEFAULT_COUNTRY_CODE` and fall back to unfiltered results rather than showing an empty page.
- Chat must work without any LLM key (rule-based). LLM is optional behind a flag.

## 9. Definition of done (per feature)
- Works end-to-end against real Mongo + TM.
- Input validated; errors handled; loading/empty/error states present in UI.
- Matches Design.md.
- Committed with a clear message.

## 10. When uncertain
Choose the simplest option that satisfies PRD.md, state the assumption in one line in the PR/commit body, and continue. Do not stop to ask unless blocked by missing credentials.

## 11. Viva readiness
Maintain a short `README.md` section "How it works" covering: architecture, the share-link/unique-click logic, the chat intent flow, and tradeoffs (lightweight auth, in-memory cache). The developer must be able to explain every file.
