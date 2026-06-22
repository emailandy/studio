'use server'

import { db } from "@/lib/firebase-admin";

export async function shareTripAction(tripId: string, email: string) {
  if (!tripId || !email) {
    return { success: false, error: "Invalid parameters" };
  }

  try {
    const tripRef = db.collection("trips").doc(tripId);
    const tripSnap = await tripRef.get();

    if (tripSnap.exists) {
      const tripData = tripSnap.data();
      const sharedWith = tripData?.sharedWith || [];

      if (!sharedWith.includes(email)) {
        await tripRef.update({
          sharedWith: [...sharedWith, email]
        });
        return { success: true };
      } else {
        return { success: false, error: "Already shared" };
      }
    } else {
      return { success: false, error: "Trip not found" };
    }
  } catch (e: any) {
    console.error("Failed to share trip in action", e);
    return { success: false, error: `${e.message}\n${e.stack}` || "Failed to share trip" };
  }
}
