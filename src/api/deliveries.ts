import {
    isDelivery,
    isDeliveryEvent,
    type DeliveryEvent,
    type DeliverySnapshot,
} from "../types/delivery";

export async function fetchDeliveries(
    signal: AbortSignal
): Promise<DeliverySnapshot> {
    const response = await fetch("/api/deliveries", { signal });

    if (!response.ok) {
        throw new Error(`Failed to fetch deliveries: ${response.status}`);
    }

    const data: unknown = await response.json();

    if (
        data === null ||
        typeof data !== "object" ||
        !("deliveries" in data) ||
        !Array.isArray(data.deliveries) ||
        !data.deliveries.every(isDelivery) ||
        !("streamId" in data) ||
        typeof data.streamId !== "string" ||
        data.streamId.length === 0 ||
        !("cursor" in data) ||
        typeof data.cursor !== "number" ||
        !Number.isSafeInteger(data.cursor) ||
        data.cursor < 0
    ) {
        throw new Error("Invalid deliveries snapshot");
    }

    return {
        deliveries: data.deliveries,
        cursor: data.cursor,
        streamId: data.streamId,
    };
}

export async function fetchDeliveryChanges(
    after: number,
    streamId: string,
    signal: AbortSignal
): Promise<DeliveryEvent[] | null> {
    const query = new URLSearchParams({ after: String(after), streamId });
    const response = await fetch(`/api/delivery-changes?${query}`, { signal });

    if (response.status === 409) return null;

    if (!response.ok) {
        throw new Error(`Failed to fetch delivery changes: ${response.status}`);
    }
    const data: unknown = await response.json();

    if (!Array.isArray(data) || !data.every(isDeliveryEvent)) {
        throw new Error("Invalid delivery events response");
    }
    return data;
}