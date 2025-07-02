import * as fs from 'fs';

let content = fs.readFileSync('./src/components/admin/UserDeleteModal.tsx', 'utf-8');

// Fix the malformed debug call - add missing colon after message
content = content.replace(
    /debug\.error\("UserDeleteModal", "Detailed auth deletion error", { {\s*message authError\.message,/g,
    'debug.error("UserDeleteModal", "Detailed auth deletion error", { message: authError.message,'
);

// Remove any double braces
content = content.replace(/{ {/g, '{');

fs.writeFileSync('./src/components/admin/UserDeleteModal.tsx', content);
console.log('Fixed UserDeleteModal.tsx debug call');
