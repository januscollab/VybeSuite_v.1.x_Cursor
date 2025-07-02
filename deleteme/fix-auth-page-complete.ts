import * as fs from 'fs';

let content = fs.readFileSync('./src/components/AuthPage.tsx', 'utf-8');

// Fix the malformed debug call completely - look for the pattern and replace the whole thing
content = content.replace(
    /debug\.info\("AuthPage", "🔍 Auth error details", {[^}]+originalMessage: error\.message,[^}]+status: error\.status,[^}]+mode[^}]+} }\);/s,
    'debug.info("AuthPage", "🔍 Auth error details", { originalMessage: error.message, code: error.code, status: error.status, mode });'
);

// Also fix any standalone issues
content = content.replace(/} }\);/g, '});');

fs.writeFileSync('./src/components/AuthPage.tsx', content);
console.log('Fixed AuthPage.tsx completely');
