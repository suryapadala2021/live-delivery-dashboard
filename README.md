# Live Delivery Dashboard

A React and TypeScript dashboard for dispatchers to search deliveries, filter by status, and view delivery details as changes arrive. A local Node.js server provides HTTP snapshots and WebSocket events.

## Run locally

Use Node.js 22.13+ and npm.

```sh
npm ci
node server/index.mjs
```

In a second terminal, run `npm run dev` and open the URL printed by Vite. The backend listens on port 3001. The demo removes delivery 1 ten seconds after backend startup.

## How synchronization works

- The first connection loads an HTTP snapshot with a stream ID and cursor.
- On reconnect, the client requests missed events after its saved cursor. It buffers live events during catch-up, then applies events in cursor order, skips duplicates, and reconnects if it detects a gap.
- Delivery versions and removal records prevent stale events from overwriting newer data or restoring deleted rows. If the backend restarts and loses its in-memory history, the client loads a fresh snapshot.

## Checks

```sh
npm run build
npm run lint
npm run test:run
```
