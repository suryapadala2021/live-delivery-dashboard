import { describe, expect, it } from "vitest";
import type { Delivery } from "../types/delivery";
import mergeDeliveryUpdate from "./mergeDeliveryUpdate";

describe("merge delivery updates", () => {
    it("ignores an older version and preserves the array reference", () => {
        const existing: Delivery[] = [
            {
                id: "1",
                driverName: "John Doe",
                status: "on-the-way",
                location: {
                    latitude: 37.7749,
                    longitude: -122.4194
                },
                version: 5
            }
        ]
        const incoming: Delivery = {
            id: "1",
            driverName: "John Doe",
            status: "delivered",
            location: {
                latitude: 37.7749,
                longitude: -122.4194
            },
            version: 2
        }

        const state = { deliveries: existing, removedVersions: {} };
        const result = mergeDeliveryUpdate(state, incoming);
        const resultArr = result.deliveries;
        expect(result).toBe(state);
        expect(resultArr).toBe(existing)
        expect(resultArr[0].status).toBe("on-the-way");
        expect(resultArr[0].version).toBe(5);
    })
    it("ignores an equal version and preserves the array reference", () => {
        const existing: Delivery[] = [
            {
                id: "1",
                driverName: "John Doe",
                status: "on-the-way",
                location: {
                    latitude: 37.7749,
                    longitude: -122.4194
                },
                version: 5
            }
        ]
        const incoming: Delivery = {
            id: "1",
            driverName: "John Doe",
            status: "delivered",
            location: {
                latitude: 37.7749,
                longitude: -122.4194
            },
            version: 5
        }

        const state = { deliveries: existing, removedVersions: {} };
        const result = mergeDeliveryUpdate(state, incoming);
        const resultArr = result.deliveries;
        expect(result).toBe(state);
        expect(resultArr).toBe(existing)
        expect(resultArr[0].status).toBe("on-the-way");
        expect(resultArr[0].version).toBe(5);
    })
    it("applies a newer version without mutating existing data and preserves unrelated delivery references", () => {
        const existing: Delivery[] = [
            {
                id: "1",
                driverName: "John Doe",
                status: "on-the-way",
                location: {
                    latitude: 37.7749,
                    longitude: -122.4194
                },
                version: 2
            },
            {
                id: "2",
                driverName: "John Sena",
                status: "delivered",
                location: {
                    latitude: 37.7749,
                    longitude: -122.4194
                },
                version: 2
            }
        ]

        const incoming: Delivery = {
            id: "1",
            driverName: "John Doe",
            status: "delayed",
            location: {
                latitude: 37.7749,
                longitude: -122.4194
            },
            version: 5
        }
        const state = { deliveries: existing, removedVersions: {} };
        const result = mergeDeliveryUpdate(state, incoming);
        const resultArr = result.deliveries

        expect(existing[0].status).toBe("on-the-way");
        expect(existing[0].version).toBe(2);
        expect(resultArr[0].status).toEqual("delayed")
        expect(resultArr[1]).toBe(existing[1])
        expect(resultArr).not.toBe(existing)
        expect(resultArr[0]).not.toBe(existing[0])
        expect(resultArr[0].version).toBe(5);
    });
    it("appends a new delivery without mutating existing data", () => {
        const existing: Delivery[] = [
            {
                id: "1",
                driverName: "John Doe",
                status: "on-the-way",
                location: {
                    latitude: 37.7749,
                    longitude: -122.4194
                },
                version: 2
            },
            {
                id: "2",
                driverName: "John Sena",
                status: "delivered",
                location: {
                    latitude: 37.7749,
                    longitude: -122.4194
                },
                version: 2
            }
        ]
        const incoming: Delivery = {
            id: "3",
            driverName: "John Doe",
            status: "delayed",
            location: {
                latitude: 37.7749,
                longitude: -122.4194
            },
            version: 5
        }
        const state = { deliveries: existing, removedVersions: {} };
        const result = mergeDeliveryUpdate(state, incoming);
        const resultArr = result.deliveries
        expect(resultArr).not.toBe(existing);
        expect(resultArr.length).toEqual(existing.length + 1)
        expect(resultArr[0]).toBe(existing[0])
        expect(resultArr[1]).toBe(existing[1])
        expect(resultArr[2]).toBe(incoming);
        expect(existing).toHaveLength(2);
    });
})