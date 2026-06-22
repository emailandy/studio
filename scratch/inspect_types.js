import { Client } from "@googlemaps/google-maps-services-js";
const client = new Client({});
const req = {
    params: {
        query: "test",
        key: "test",
        // Let's see if location is valid here via IDE/compiler or just running tsc
        location: [0, 0],
        radius: 5000
    }
};
console.log(req);
