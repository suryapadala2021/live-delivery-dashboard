import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const deliveries = [
  {
    id: "1",
    driverName: "John Doe",
    status: "delivered",
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    version: 2,
  },
  {
    id: "2",
    driverName: "Surya",
    status: "delayed",
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    version: 2,
  },
  {
    id: "3",
    driverName: "Jane Smith",
    status: "on-the-way",
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    version: 1,
  },
  {
    id: "4",
    driverName: "Alice Johnson",
    status: "delayed",
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    version: 1,
  },
  {
    id: "5",
    driverName: "Bob Brown",
    status: "on-the-way",
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    version: 1,
  }
];
const streamId = randomUUID();
let cursor = 0;
const deliveryEvents = [];
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost:3001");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET" && req.url === "/api/deliveries") {
    const snapshot = {
      deliveries: structuredClone(deliveries),
      cursor,
      streamId,
    };

    setTimeout(() => {
      res.writeHead(200);
      res.end(JSON.stringify(snapshot));
    }, 1); // Simulate a 1-second delay
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/delivery-changes") {
    const rawAfter = url.searchParams.get("after");
    const after = Number(rawAfter);

    if (
      rawAfter === null ||
      rawAfter.trim() === "" ||
      !Number.isSafeInteger(after) ||
      after < 0
    ) {
      res.writeHead(400);
      res.end(JSON.stringify({ message: "Invalid after cursor" }));
      return;
    }

    const requestedStream = url.searchParams.get("streamId");
    if ((requestedStream !== null && requestedStream !== streamId) || after > cursor) {
      res.writeHead(409);
      res.end(JSON.stringify({ message: "Load a fresh delivery snapshot" }));
      return;
    }

    const events = deliveryEvents.filter(event => event.cursor > after);

    res.writeHead(200);
    res.end(JSON.stringify(events));
    return;
  }
  res.writeHead(404);
  res.end(JSON.stringify({ message: "Route not found" }));
});
const wss = new WebSocketServer({
  server,
  path: "/ws",
});

function publishEvent(change) {
  const event = structuredClone({
    ...change,
    cursor: ++cursor,
  });

  deliveryEvents.push(event);

  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(JSON.stringify(event));
    }
  }
}

wss.on("connection", (socket) => {
  console.log("WebSocket client connected");
  socket.send(JSON.stringify({
    type: "connected",
    message: "Live updates connected",
  }));
});

setTimeout(() => {
  const index = deliveries.findIndex(delivery => delivery.id === "1");
  if (index === -1) return;

  const removalVersion = deliveries[index].version + 1;

  deliveries.splice(index, 1);

  publishEvent({
    type: "delivery-removed",
    id: "1",
    version: removalVersion,
  });
}, 10_000);

server.listen(3001, () => {
  console.log("Server running at http://localhost:3001");
});