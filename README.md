# 🚀 Real-Time Event Synchronization Engine

A full-stack real-time event management system where users can create events, join events, and see live updates instantly using WebSockets.

---

## 🏗 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Socket.io-client |
| Backend | Node.js, Express.js, TypeScript, Socket.io |
| Database | PostgreSQL (Docker) |
| ORM | Prisma v5 |
| Auth | JWT + bcrypt + Zod |

---

## 📁 Project Structure

```
Real Time Event/
├── docker-compose.yml       # PostgreSQL DB container
├── package.json             # Root: runs both client + server
├── client/                  # Vite + React + Tailwind frontend
│   └── src/
│       ├── App.tsx
│       ├── context/         # AuthContext, ThemeContext
│       ├── pages/           # Home, Login, Register, Dashboard, EventDetail
│       ├── components/      # Navbar, EventCard, LoadingSpinner
│       ├── services/        # api.ts (Axios), socket.ts (Socket.io)
│       └── types/           # Shared TypeScript interfaces
└── server/                  # Express + Socket.io backend
    ├── prisma/schema.prisma
    └── src/
        ├── index.ts
        ├── prisma.ts
        ├── middleware/auth.ts
        ├── routes/auth.ts
        ├── routes/events.ts
        └── sockets/index.ts
```

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## 🚀 Setup Instructions

### Step 1 — Start the PostgreSQL Database

> **Do NOT skip this step.** The backend will fail to connect without a running database.

```bash
# From the project root
docker-compose up -d
```

Verify it's running:
```bash
docker ps
# You should see: event_engine_db   postgres:15-alpine   Up
```

---

### Step 2 — Install Dependencies

```bash
# From the project root — installs root, server, and client dependencies
cd "Real Time Event"

# Install root concurrently
npm install

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

---

### Step 3 — Configure Environment

The server `.env` file is pre-configured at `server/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/event_engine"
JWT_SECRET="supersecretkey_real_time_event_engine"
PORT=5000
NODE_ENV=development
```

> If you changed the Docker credentials, update `DATABASE_URL` accordingly.

---

### Step 4 — Run Prisma Migrations

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
```

You should see: `✔ Generated Prisma Client`  
And: `The following migration(s) have been applied: 20xx_init`

Optionally open Prisma Studio to view your database:
```bash
npx prisma studio
```

---

### Step 5 — Start the Application

From the **project root**:
```bash
npm start
```

This runs both concurrently:
- ✅ **Server**: `http://localhost:5000`
- ✅ **Client**: `http://localhost:5173`

---

## 🖥 Pages & Features

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with feature overview |
| Register | `/register` | Create a new account |
| Login | `/login` | Sign in with JWT |
| Dashboard | `/dashboard` | Browse, search, filter, create events |
| Event Detail | `/events/:id` | Real-time chat, participant list, status management |

---

## 📡 WebSocket Events

| Event (Client → Server) | Description |
|---|---|
| `join-event` | Socket joins the event room |
| `leave-event` | Socket leaves the event room |
| `chat-message` | Send a chat message to the event room |
| `event-status-update` | Creator/Admin broadcasts status changes |

| Event (Server → Client) | Description |
|---|---|
| `participant-count` | Updated count emitted to the room |
| `new-message` | New chat message broadcast |
| `user-joined` / `user-left` | Notification when a user enters/exits |
| `event-updated` | Status change broadcast |

---

## 🔒 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register a user |
| POST | `/api/auth/login` | ❌ | Login and get JWT |
| GET | `/api/auth/me` | ✅ | Get current user info |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | ✅ | List all events (search + filter) |
| POST | `/api/events` | ✅ | Create a new event |
| GET | `/api/events/my` | ✅ | Your created events |
| GET | `/api/events/joined` | ✅ | Events you joined |
| GET | `/api/events/:id` | ✅ | Event details + participants + messages |
| POST | `/api/events/:id/join` | ✅ | Join an event |
| DELETE | `/api/events/:id/leave` | ✅ | Leave an event |
| PATCH | `/api/events/:id/status` | ✅ | Update event status (creator/admin) |
| DELETE | `/api/events/:id` | ✅ | Delete event (creator/admin) |

---

## 🎨 Features Implemented

- ✅ JWT Authentication with bcrypt + Zod validation
- ✅ Real-time WebSocket chat per event room
- ✅ Live participant count updates
- ✅ Event search & status filtering
- ✅ Admin role support (can update/delete any event)
- ✅ Dark / Light mode toggle (persisted in localStorage)
- ✅ Toast notifications for all actions
- ✅ Socket reconnect logic
- ✅ WebSocket connection status indicator
- ✅ Protected routes on frontend
- ✅ Glassmorphism Navbar with avatar & role badge
- ✅ Create event modal on Dashboard

---

## 🛑 Stop the Application

```bash
# Stop the database container
docker-compose down

# To also remove the volume (delete all DB data)
docker-compose down -v
```
