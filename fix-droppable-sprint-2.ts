import * as fs from 'fs';

let content = fs.readFileSync('./src/components/DroppableSprintCard.tsx', 'utf-8');

// Fix the double brace issue
content = content.replace(
    /debug\.info\("DroppableSprintCard", "🔒 Priority Sprint detected", { {[^}]+id,[^}]+isPrioritySprint,[^}]+isSpecialSprint,[^}]+}/s,
    'debug.info("DroppableSprintCard", "🔒 Priority Sprint detected", { id, isPrioritySprint, isSpecialSprint }'
);

// Also fix any remaining double braces
content = content.replace(/{ {/g, '{');

fs.writeFileSync('./src/components/DroppableSprintCard.tsx', content);
console.log('Fixed DroppableSprintCard.tsx second debug call');
