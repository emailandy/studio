function cleanLocationName(locationName: string): string {
    // Strip prefixes
    let cleaned = locationName
        .replace(/^Check-in:\s*/i, '')
        .replace(/^Event:\s*/i, '')
        .trim();

    // Handle concatenated strings with ", Event:" or similar if they exist
    // Wait, the error string was: "Check-in: BetterЯ03青森橋本208号室 - One-Bedroom Apartment, Event: Tokyo Sakura Cherry Blossom River Cruise"
    // If we split by ", " and take the first part, we get "Check-in: BetterЯ03..."
    // Let's see if splitting is safe.
    
    // Split by comma if it seems to separate distinct entities (e.g. "Location, Event: ...")
    if (cleaned.includes(', Event:')) {
         cleaned = cleaned.split(', Event:')[0];
    } else if (cleaned.includes(', Check-in:')) {
         cleaned = cleaned.split(', Check-in:')[0];
    }
    
    return cleaned.trim();
}

const testStr = "Check-in: BetterЯ03青森橋本208号室 - One-Bedroom Apartment, Event: Tokyo Sakura Cherry Blossom River Cruise";
console.log("Original:", testStr);
console.log("Cleaned :", cleanLocationName(testStr));

const testStr2 = "Event: Tokyo Sakura Cherry Blossom River Cruise";
console.log("Original:", testStr2);
console.log("Cleaned :", cleanLocationName(testStr2));

const testStr3 = "BetterЯ03青森橋本208号室";
console.log("Original:", testStr3);
console.log("Cleaned :", cleanLocationName(testStr3));
