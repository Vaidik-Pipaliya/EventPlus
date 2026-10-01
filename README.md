# EventPulse

EventPulse is a full-stack event discovery, RSVP tracking, social sharing, and real-time chat platform.

## Features
- **Event Discovery:** Browse events via Ticketmaster Discovery API v2 with in-memory caching and city/date filters.
- **Event Calendar:** Interactive monthly calendar highlighting event density with one-click filtering.
- **Dual Authentication:** Email/password with bcrypt hashing + Google Sign-In via Firebase, unified by 7-day app JWTs.
- **RSVPs & Reminders:** Idempotent event tracking with Upcoming/Past views and customizable reminder alerts.
- **Social Sharing ("Vibe Check"):** Unique link generation for RSVP'd events with deduplicated visitor click tracking.
- **Real-Time Assistant:** Socket.IO chat gateway with rule-based NLP intent recognition for event queries and RSVP management.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, TanStack Query, Socket.IO client, Lucide React, Firebase Web SDK
- **Backend:** Node.js 20, Express, Mongoose (MongoDB), Socket.IO, Zod, Firebase Admin, bcryptjs, jsonwebtoken, helmet, cors, express-rate-limit, nanoid, axios, cookie-parser

## Quick Start
See `server/README.md` and `client/README.md` or run:
```bash
# Server
cd server
npm install
npm run dev

# Client
cd client
npm install
npm run dev
```
