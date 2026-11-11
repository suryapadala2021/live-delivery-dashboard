import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { isDeliveryEvent, type DeliveryEvent, type DeliveryState, type DeliveryStatusFilter } from "./types/delivery";
import mergeDeliveryUpdate from "./utils/mergeDeliveryUpdate";
import { fetchDeliveries, fetchDeliveryChanges } from "./api/deliveries";
import removeDelivery from "./utils/removeDeliveryUpdates";


function applyDeliveryEvent(state: DeliveryState, event: DeliveryEvent): DeliveryState {
  if (event.type === "delivery-updated") {
    return mergeDeliveryUpdate(state, event.delivery);
  }

  return removeDelivery(state, event.id, event.version);
}

function App() {
  const [status, setStatus] = useState<DeliveryStatusFilter>("all");
  const [searchId, setSearchId] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [wsConnectionStatus, setWsConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [deliveryState, setDeliveryState] = useState<DeliveryState>({
    deliveries: [],
    removedVersions: {}
  })
  const lastApplied = useRef<{ streamId: string; cursor: number } | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let socket: WebSocket | undefined;
    let stopped = false;
    let activeController: AbortController | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retryCount = 0;

    function connect() {
      if (stopped) return;

      setWsConnectionStatus("connecting");
      if (lastApplied.current === null) setIsLoading(true);

      const connection = new WebSocket("ws://localhost:3001/ws");
      socket = connection;
      const controller = new AbortController();
      activeController = controller;
      const pendingEvents: DeliveryEvent[] = [];
      let synced = false;

      function applyEvents(
        position: { streamId: string; cursor: number },
        events: DeliveryEvent[],
        snapshot?: DeliveryState
      ) {
        let cursor = position.cursor;
        const updates: DeliveryEvent[] = [];

        for (const event of events) {
          if (event.cursor <= cursor) continue;
          if (event.cursor !== cursor + 1) {
            throw new Error(`Expected event ${cursor + 1}, received ${event.cursor}`);
          }
          updates.push(event);
          cursor = event.cursor;
        }

        if (snapshot || updates.length > 0) {
          setDeliveryState(prev => updates.reduce(applyDeliveryEvent, snapshot ?? prev));
        }
        lastApplied.current = { streamId: position.streamId, cursor };
      }

      connection.addEventListener("open", async () => {
        if (stopped || controller.signal.aborted) return;

        const timeout = setTimeout(() => {
          controller.abort();
          connection.close();
        }, 10_000);

        try {
          const saved = lastApplied.current;
          const missedEvents = saved
            ? await fetchDeliveryChanges(saved.cursor, saved.streamId, controller.signal)
            : null;

          if (stopped || controller.signal.aborted) return;

          if (saved && missedEvents !== null) {
            const events = [...missedEvents, ...pendingEvents].sort((a, b) => a.cursor - b.cursor);
            applyEvents(saved, events);
          } else {
            const snapshot = await fetchDeliveries(controller.signal);
            if (stopped || controller.signal.aborted) return;

            applyEvents(snapshot, pendingEvents, {
              deliveries: snapshot.deliveries,
              removedVersions: {},
            });
          }

          pendingEvents.length = 0;
          synced = true;
          retryCount = 0;
          setIsLoading(false);
          setError(null);
          setRefreshError(null);
          setLastUpdatedAt(Date.now());
          setWsConnectionStatus("connected");
        } catch (error) {
          if (stopped || controller.signal.aborted) return;
          console.error("Unable to synchronize deliveries", error);
          connection.close();
        } finally {
          clearTimeout(timeout);
        }
      });

      connection.addEventListener("message", (event) => {
        if (stopped || controller.signal.aborted) return;

        try {
          const message: unknown = JSON.parse(event.data);
          if (
            message !== null &&
            typeof message === "object" &&
            "type" in message &&
            message.type === "connected"
          ) return;

          if (!isDeliveryEvent(message)) {
            throw new Error("Invalid delivery event");
          }

          if (!synced) {
            pendingEvents.push(message);
            return;
          }

          const position = lastApplied.current;
          if (position) applyEvents(position, [message]);
        } catch (error) {
          console.error("Unable to process live delivery event", error);
          connection.close();
        }
      });

      connection.addEventListener("close", () => {
        controller.abort();
        if (stopped) return;

        setWsConnectionStatus("disconnected");
        setIsLoading(false);
        if (lastApplied.current === null) {
          setError("Unable to load deliveries. Please try again.");
        } else {
          setRefreshError("Live updates disconnected. Displayed data may be outdated.");
        }

        const maxDelay = Math.min(30_000, 2_000 * 2 ** retryCount);
        retryCount += 1;
        retryTimer = setTimeout(connect, Math.random() * maxDelay);
      });
    }

    connect();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      activeController?.abort();
      socket?.close();
    };
  }, [retryKey]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchId(e.target.value);
  };

  const visibleDeliveries = deliveryState.deliveries.filter((eachDelivery) => (status === "all" || status === eachDelivery.status) && (searchId === "" || eachDelivery.id.includes(searchId.trim())))
  const selectedDelivery = selectedId ? deliveryState.deliveries.find((eachDelivery) => eachDelivery.id === selectedId) : null;

  return (
    <main>
      <label htmlFor="statusFilter">Status Filter</label>
      <select id="statusFilter" onChange={(e) => setStatus(e.target.value as DeliveryStatusFilter)} value={status}>
        <option value="all">All</option>
        <option value="on-the-way">On the way</option>
        <option value="delayed" >Delayed</option>
        <option value="delivered">Delivered</option>
      </select>
      <label htmlFor="searchDeliveryId">Delivery Id Search</label>
      <input type="search" id="searchDeliveryId" onChange={handleSearchChange} value={searchId} />
      {refreshError &&
        <div role="status">
          <p>{refreshError}</p>
          <button onClick={() => setRetryKey(key => key + 1)}>Retry</button>
        </div>}
      {lastUpdatedAt !== null && (
        <p>
          Last refreshed: {new Date(lastUpdatedAt).toLocaleTimeString()}
        </p>
      )}
      <p role="status">Live updates: {wsConnectionStatus}</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Delivery ID</th>
            <th scope="col">Driver name</th>
            <th scope="col">Status</th>
            <th scope="col"></th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? <tr>
            <td colSpan={4}>Loading...</td>
          </tr> : error ? <tr>
            <td colSpan={4}>{error} <button onClick={() => setRetryKey(key => key + 1)}>Retry</button></td>
          </tr> :
            visibleDeliveries.length > 0 ?
              visibleDeliveries.map((eachDelivery) => (
                <tr key={eachDelivery.id}>
                  <td >
                    {eachDelivery.id}
                  </td>
                  <td>
                    {eachDelivery.driverName}
                  </td>
                  <td>
                    {eachDelivery.status}
                  </td>
                  <td>
                    <button onClick={() => setSelectedId(eachDelivery.id)}>view</button>
                  </td>
                </tr>
              )) :
              <tr>
                <td colSpan={4}>No Deliveries Found for your filter</td>
              </tr>
          }
        </tbody>
      </table>
      {selectedDelivery && (
        <div>
          <h2>Delivery Details</h2>
          <p><strong>Delivery ID:</strong> {selectedDelivery.id}</p>
          <p><strong>Driver Name:</strong> {selectedDelivery.driverName}</p>
          <p><strong>Status:</strong> {selectedDelivery.status}</p>
          <p><strong>Location:</strong> Latitude: {selectedDelivery.location.latitude}, Longitude: {selectedDelivery.location.longitude}</p>
          <button onClick={() => setSelectedId(null)}>Close</button>
        </div>
      )}
    </main >
  )
}

export default App
