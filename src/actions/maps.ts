"use server";

import { computeRouteMatrixFlow } from "@/ai/flows/compute-route-matrix";

export async function calculateDistancesAction(origins: any[], destinations: any[]) {
    try {
        const result = await computeRouteMatrixFlow({
            origins,
            destinations,
        });
        return result;
    } catch (error) {
        console.error("Server Action calculateDistancesAction failed:", error);
        throw error;
    }
}
