import { findNearbyPlacesTool } from '../src/services/google-maps';

async function main() {
    process.env.GOOGLE_MAPS_API_KEY = "AIzaSyA3GzhCkSyduLutDwRj80NF0dgiSYTDrUs";
    process.env.GEMINI_API_KEY = "AIzaSyA3GzhCkSyduLutDwRj80NF0dgiSYTDrUs";
    try {
        const results = await findNearbyPlacesTool({
            latitude: 25.7212,
            longitude: -80.2684,
            radius: 4828,
            type: 'lodging'
        });
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
