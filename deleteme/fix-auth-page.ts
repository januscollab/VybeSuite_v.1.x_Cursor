import * as fs from 'fs';

let content = fs.readFileSync('./src/components/AuthPage.tsx', 'utf-8');

// Fix the malformed debug call - add missing colon after originalMessage
content = content.replace(
    /debug\.info\("AuthPage", "🔍 Auth error details", { {\s*originalMessage error\.message,/g,
    'debug.info("AuthPage", "🔍 Auth error details", { originalMessage: error.message,'
);

// Remove any extra opening braces
content = content.replace(/{ {/g, '{');

fs.writeFileSync('./src/components/AuthPage.tsx', content);
console.log('Fixed AuthPage.tsx debug call');
