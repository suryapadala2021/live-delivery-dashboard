import { describe, expect, it } from "vitest";
import { isDelivery } from "./types/delivery";

describe('testing isDelivery function', () => {
    it("rejects a delivery whose version is a string", () => {
        const delivery = {
            id: "1",
            driverName: "John Doe",
            status: "on-the-way",
            location: {
                latitude: 37.7749,
                longitude: -122.4194
            },
            version: "1"
        }
        expect(isDelivery(delivery)).toBe(false);
    });
    it("accept a delivery whose version is a valid integer and greather then zero", () => {
        const delivery = {
            id: "1",
            driverName: "John Doe",
            status: "on-the-way",
            location: {
                latitude: 37.7749,
                longitude: -122.4194
            },
            version: 2
        }
        expect(isDelivery(delivery)).toBe(true);
    });
    it("rejects a delivery with a non-finite longitude", () => {
        const delivery = {
            id: "1",
            driverName: "John Doe",
            status: "on-the-way",
            location: {
                latitude: 37.7749,
                longitude: Infinity
            },
            version: 2
        }
        expect(isDelivery(delivery)).toBe(false);
    });
     it("rejects a delivery with a null location", () => {
        const delivery = {
            id: "1",
            driverName: "John Doe",
            status: "on-the-way",
            location: null,
            version: 2
        }
        expect(isDelivery(delivery)).toBe(false);
    });
})