import * as fs from 'fs';

let content = fs.readFileSync('./src/components/DroppableSprintCard.tsx', 'utf-8');

// Fix the malformed debug call - remove quotes around 'type' and fix syntax
content = content.replace(
    /debug\.info\("DroppableSprintCard", "Close Sprint clicked for sprint", { id,\s+'type',\s+type\s+}\);/g,
    'debug.info("DroppableSprintCard", "Close Sprint clicked for sprint", { id, type });'
);

fs.writeFileSync('./src/components/DroppableSprintCard.tsx', content);
console.log('Fixed DroppableSprintCard.tsx debug call');
