import * as fs from 'fs';

let content = fs.readFileSync('./src/components/DroppableSprintCard.tsx', 'utf-8');

// Fix the exact malformed debug call on line 65
content = content.replace(
    'debug.info("DroppableSprintCard", "🔒 Priority Sprint detected", { id, isPrioritySprint, isSpecialSprint } });',
    'debug.info("DroppableSprintCard", "🔒 Priority Sprint detected", { id, isPrioritySprint, isSpecialSprint });'
);

fs.writeFileSync('./src/components/DroppableSprintCard.tsx', content);
console.log('Fixed DroppableSprintCard.tsx final debug call');
