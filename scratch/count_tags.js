const fs = require('fs');
const content = fs.readFileSync('/Users/emailandy/Documents/Code/Priceline/TravelDiscovery/src/app/page.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let inTag = false;
let currentTag = "";
let inString = false;
let stringChar = "";

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (inString) {
        if (char === stringChar && content[i-1] !== '\\\\') {
            inString = false;
        }
        continue;
    }
    if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
        continue;
    }
    if (char === '<' && content[i+1] !== ' ') {
        inTag = true;
        currentTag = "";
        continue;
    }
    if (char === '>') {
        inTag = false;
        if (currentTag.startsWith('/')) {
            const tagname = currentTag.substring(1);
            if (stack.length > 0 && stack[stack.length-1] === tagname) {
                stack.pop();
            } else {
                console.log(`Mismatch: Found </${tagname}>, expected </${stack[stack.length-1]}>`);
            }
        } else if (!currentTag.endsWith('/')) {
             const tagname = currentTag.split(' ')[0];
             if (tagname && !tagname.match(/^[a-zA-Z0-9]+$/)) continue; 
             stack.push(tagname);
        }
        continue;
    }
    if (inTag) {
        currentTag += char;
    }
}
console.log("Remaining Stack:", stack);
