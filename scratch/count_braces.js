const fs = require('fs');
const content = fs.readFileSync('/Users/emailandy/Documents/Code/Priceline/TravelDiscovery/src/app/page.tsx', 'utf8');
let depth = 0;
const lines = content.split('\n');
lines.forEach((line, index) => {
  const openCount = (line.match(/\{/g) || []).length;
  const closeCount = (line.match(/\}/g) || []).length;
  const prevDepth = depth;
  depth += openCount - closeCount;
  if (depth !== prevDepth && (index > 900 && index < 1145)) {
     console.log(`Line ${index + 1}: Depth ${depth} (${line.trim()})`);
  }
});
