import * as fs from 'fs';

let content = fs.readFileSync('./src/components/admin/UserDeleteModal.tsx', 'utf-8');

// Fix the extra closing brace issue
content = content.replace(/} }\);/g, '});');

fs.writeFileSync('./src/components/admin/UserDeleteModal.tsx', content);
console.log('Fixed UserDeleteModal.tsx complete syntax');
