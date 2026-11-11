import type { Delivery, DeliveryState } from "../types/delivery"

function mergeDeliveryUpdate(
    state: DeliveryState,
    incoming: Delivery
): DeliveryState {
    const removedVersion = state.removedVersions[incoming.id];

    if (
        removedVersion !== undefined &&
        incoming.version <= removedVersion
    ) {
        return state;
    }
    const removedVersions = { ...state.removedVersions };
    delete removedVersions[incoming.id];
    const exist = state.deliveries.find((existing) => existing.id === incoming.id)
    if (!exist) {
        return { ...state, removedVersions, deliveries: [...state.deliveries, incoming] }
    }
    if (exist.version >= incoming.version) {
        return state
    }
    const modifiedDeliveries = state.deliveries.map((current) => {
        if (current.id === incoming.id) {
            return incoming
        }
        return current;
    })
    return { ...state, removedVersions, deliveries: modifiedDeliveries }
}
export default mergeDeliveryUpdate