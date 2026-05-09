# Altfmeet

A high-performance, real-time random video and text chat platform inspired by Omegle. Built with a modern tech stack focusing on low-latency communication, sleek aesthetics, and robust WebRTC integration.

## Project Overview

Altfmeet is a privacy-focused, anonymous chat application that connects strangers globally. It leverages a custom matchmaking engine to pair users into private rooms where they can interact via text, audio, and video.

The architecture follows a decoupled client-server model:

* **Backend:** A Node.js signaling and matchmaking server.
* **Frontend:** A high-performance React SPA with a premium glassmorphism design.

## Features

### Frontend Features

* Responsive Dashboard: Mobile-first design using Tailwind CSS 4.0.
* Media Management: One-click toggle for Camera and Microphone.
* Real-time Status: Live indicators for connection stability and partner presence.
* Glassmorphic UI: Premium aesthetics with backdrop blurs and smooth Framer Motion transitions.
* Toast Notifications: Context-aware alerts for matching, disconnections, and errors.

### Backend Features

* In-Memory Matching: Blazing fast matchmaking using a FIFO queue system.
* Room Management: Automated lifecycle management for private chat rooms.
* Graceful Cleanup: Automatic resource release on socket disconnection.
* Health Monitoring: Built-in health check endpoints for deployment monitoring.

### Real-Time & WebRTC Features

* Signal Orchestration: Managed exchange of SDP offers, answers, and ICE candidates.
* Low Latency Chat: Instant text messaging via Socket.IO.
* Peer-to-Peer Streaming: Direct media transmission between browsers for maximum privacy.
* Next-Partner Flow: Seamless transition between matches with automated cleanup.

## Tech Stack

### Frontend

* Framework: React 19 (Vite)
* State Management: Zustand
* Styling: Tailwind CSS 4.0
* Animations: Framer Motion
* Icons: Lucide React
* Real-time: Socket.io-client
* Signaling: Native WebRTC API

### Backend

* Runtime: Node.js
* Framework: Express.js
* Real-time: Socket.io
* Logging: Winston
* ID Generation: UUID v4

## Project Architecture

```text
altfmegle/
├── backend/                # Signaling & Matchmaking Server
│   ├── config/             # Socket and CORS configurations
│   ├── controllers/        # Socket event logic & business flow
│   ├── routes/             # REST endpoints (Health checks)
│   ├── services/           # Queue & Room management services
│   ├── utils/              # Validations & ID generators
│   └── app.js              # Express app entry point
└── frontend/               # React Client Application
    ├── src/
    │   ├── app/            # Providers & Routing logic
    │   ├── components/     # UI, Layout, Chat, and Video components
    │   ├── hooks/          # Custom hooks for Socket, WebRTC, & Queue
    │   ├── services/       # API, Socket, and WebRTC abstractions
    │   ├── store/          # Zustand global state
    │   └── utils/          # Constants, RTC configs, and Helpers
    └── vite.config.ts      # Vite configuration
```

## System Workflow

1. **User Connection:** User connects to the Socket.io server upon landing.
2. **Queue Joining:** User clicks "Start", providing media permissions. The client emits `join_queue`.
3. **Matchmaking:** Backend QueueService finds another waiting user and creates a unique `roomId`.
4. **WebRTC Signaling:**

   * One peer is designated as the Offerer.
   * Offerer sends `send_offer` -> Backend relays `receive_offer` to Partner.
   * Partner sends `send_answer` -> Backend relays `receive_answer` to Offerer.
   * Both exchange `ice_candidates` via the server.
5. **Direct Communication:** Once the P2P connection is "stable", media streams and data flow directly between users.
6. **Disconnect Handling:** If a user leaves, the backend emits `partner_disconnected`. The client stops local streams and closes the peer connection.

## Socket Events Documentation

| Event                | Direction        | Purpose                                         |
| -------------------- | ---------------- | ----------------------------------------------- |
| connection_success   | Server -> Client | Confirms socket is ready and provides socketId. |
| join_queue           | Client -> Server | Adds user to the waiting list for matching.     |
| queue_joined         | Server -> Client | Confirms user is in queue with position data.   |
| user_matched         | Server -> Client | Notifies both users they have been paired.      |
| send_message         | Client -> Server | Sends a text message to the room.               |
| receive_message      | Server -> Client | Delivers a message from the partner.            |
| send_offer           | Client -> Server | Relays WebRTC SDP offer to partner.             |
| send_answer          | Client -> Server | Relays WebRTC SDP answer to partner.            |
| send_ice_candidate   | Client -> Server | Relays network candidates for P2P connection.   |
| partner_disconnected | Server -> Client | Notifies user that their partner has left.      |

## API Endpoints

| Method | Endpoint  | Purpose                             |
| ------ | --------- | ----------------------------------- |
| GET    | `/`       | Welcome message and version info.   |
| GET    | `/health` | Server health status and timestamp. |

## Installation Guide

### Prerequisites

* Node.js (v18+)
* npm or yarn

### Backend Setup

1. Navigate to directory: `cd backend`
2. Install dependencies: `npm install`
3. Configure `.env` (see below)
4. Start server: `npm run dev`

### Frontend Setup

1. Navigate to directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

## Environment Variables

### Backend (`/backend/.env`)

* `PORT`: Port the server runs on (default: 5000).
* `CORS_ORIGIN`: Allowed frontend URL (e.g., `http://localhost:5173`).
* `NODE_ENV`: development or production.

### Frontend (`/frontend/.env`)

* `VITE_SOCKET_URL`: URL of the backend signaling server.

## Production Deployment Guide

### Frontend

* Run `npm run build` to generate the `dist` folder.
* Deploy to Vercel, Netlify, or AWS S3.
* Ensure `VITE_SOCKET_URL` points to your production backend.

### Backend

* Deploy to Render, Railway, or Heroku.
* Set `CORS_ORIGIN` to your frontend production domain.
* Use a process manager like PM2 for auto-restarts.

**Note:** Use WSS (Secure WebSockets) for production.

## Scalability & Performance

* In-Memory Tracking: Optimized for speed, though a Redis adapter for Socket.io is recommended for multi-node scaling.
* WebRTC Offloading: Media traffic bypasses the server, reducing bandwidth costs significantly.
* Zustand State: Fine-grained re-renders ensure the UI remains fluid even during heavy signaling.

## Future Improvements

* Interest Matching: Allow users to pair based on shared tags.
* Admin Dashboard: Real-time monitoring of active rooms and queue length.
* Report System: User-driven reporting for safety and moderation.
* Face Effects: Integration of AR filters using TensorFlow.js or Face-api.js.

**Author:** [Your Name/Placeholder]
**License:** ISC
