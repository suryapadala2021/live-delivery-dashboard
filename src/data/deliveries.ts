import {type  Delivery} from "../types/delivery";

export const deliveries: Delivery[] = [
    {
        id: "1",
        driverName: "John Doe",
        status: "on-the-way",
        location: {
            latitude: 37.7749,
            longitude: -122.4194
        },
        version: 1
    },
    {
        id: "2",
        driverName: "Jane Smith",
        status: "delayed",
        location: {
            latitude: 34.0522,
            longitude: -118.2437
        },
        version: 1
    },
    {
        id: "3",
        driverName: "Bob Johnson",
        status: "delivered",
        location: {
            latitude: 40.7128,
            longitude: -74.0060
        },
        version: 1
    }
]