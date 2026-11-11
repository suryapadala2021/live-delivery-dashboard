import type { DeliveryState } from "../types/delivery";

export default function removeDelivery(
    state: DeliveryState,
    id: string,
    version: number
): DeliveryState {
    const existing = state.deliveries.find(delivery => delivery.id === id);
    const removedVersion = state.removedVersions[id];
    if (
        (existing !== undefined && version <= existing.version) ||
        (removedVersion !== undefined && version <= removedVersion)
    ) {
        return state;
    }
    const updatedDeliveries = state.deliveries.filter((delivery) => delivery.id !== id);
    const updatedRemovedVersions = { ...state.removedVersions, [id]: version };

    return {
        deliveries: updatedDeliveries,
        removedVersions: updatedRemovedVersions,
    };
}