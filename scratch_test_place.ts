import { findPlaceTool } from "./src/services/google-maps";

async function testPlace() {
  try {
    const result = await findPlaceTool({ query: "Hotel Hugo NYC" });
    console.log("TOOL RESULT FOR HOTEL HUGO:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testPlace();
