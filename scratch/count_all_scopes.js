const fs = require('fs');
const content = fs.readFileSync('/Users/emailandy/Documents/Code/Priceline/TravelDiscovery/src/app/page.tsx', 'utf8');
let pDepth = 0; // parenthesis depth
let bDepth = 0; // brace depth
const lines = content.split('\n');
lines.forEach((line, index) => {
  const pOpen = (line.match(/\(/g) || []).length;
  const pClose = (line.match(/\)/g) || []).length;
  const bOpen = (line.match(/\{/g) || []).length;
  const bClose = (line.match(/\}/g) || []).length;
  
  const prevP = pDepth;
  const prevB = bDepth;
  
  pDepth += pOpen - pClose;
  bDepth += bOpen - bClose;
  
  if ((pDepth !== prevP || bDepth !== prevB) && (index > 1050 && index < 1120)) {
     console.log(`Line ${index + 1}: P:${pDepth} B:${bDepth} | ${line.trim()}`);
  }
});
