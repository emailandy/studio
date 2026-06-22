const fs = require('fs');
const content = fs.readFileSync('/Users/emailandy/Documents/Code/Priceline/TravelDiscovery/src/app/page.tsx', 'utf8');
const lines = content.split('\\n');

let pCount = 0;
lines.forEach((line, index) => {
    const i = index + 1;
    if (i >= 1060 && i <= 1125) {
        const open = (line.match(/\\(/g) || []).length;
        const close = (line.match(/\\)/g) || []).length;
        pCount += open - close;
        console.log(`Line ${i}: depth=${pCount} | ${line.trim()}`);
    }
});
