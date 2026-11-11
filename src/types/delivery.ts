export type DeliveryStatus = "on-the-way" | "delayed" | "delivered"
export type Delivery = {
    id: string,
    driverName: string,
    status: DeliveryStatus
    location: {
        latitude: number,
        longitude: number
    }
    version: number
}
export type DeliveryStatusFilter = DeliveryStatus | "all"

export function isDelivery(value: unknown): value is Delivery {
    if (value === null || typeof value !== "object") {
        return false;
    }
    if (!("id" in value) || typeof value.id !== "string") {
        return false;
    }
    if (!("driverName" in value) || typeof value.driverName !== "string") {
        return false;
    }
    if (!("status" in value) || typeof value.status !== "string" || !["on-the-way", "delayed", "delivered"].includes(value.status)) {
        return false;
    }
    if (!("location" in value) || typeof value.location !== "object" || value.location === null) {
        return false;
    }
    if (!("latitude" in value.location) || typeof value.location.latitude !== "number" || !Number.isFinite(value.location.latitude)) {
        return false;
    }
    if (!("longitude" in value.location) || typeof value.location.longitude !== "number" || !Number.isFinite(value.location.longitude)) {
        return false;
    }
    if (!("version" in value) || typeof value.version !== "number" || !Number.isSafeInteger(value.version) || value.version < 0) {
        return false;
    }
    return true;
}

export type DeliveryState = {
    deliveries: Delivery[];
    removedVersions: Record<string, number>;
};

export type DeliverySnapshot = {
    streamId: string;
    deliveries: Delivery[];
    cursor: number;
};

export type DeliveryEvent =
    | {
        type: "delivery-updated";
        cursor: number;
        delivery: Delivery;
    }
    | {
        type: "delivery-removed";
        cursor: number;
        id: string;
        version: number;
    };

export function isDeliveryEvent(value: unknown): value is DeliveryEvent {
    if (value === null || !(typeof value === "object")) {
        return false;
    }
    if (!("cursor" in value) || (typeof value.cursor !== "number") || !Number.isSafeInteger(value.cursor) || value.cursor < 0) {
        return false;
    }
    if (!("type" in value)) return false;

    if (value.type === "delivery-updated") {
        return "delivery" in value && isDelivery(value.delivery);
    }
    if (value.type === "delivery-removed") {
        if (!("version" in value) || !(typeof value.version === "number") || !Number.isSafeInteger(value.version) || value.version < 0) return false
        if (!("id" in value) || !(typeof value.id === "string")) return false
        return true;
    }
    return false;
}