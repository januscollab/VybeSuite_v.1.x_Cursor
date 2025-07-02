import * as fs from 'fs';

// Read the current file
let content = fs.readFileSync('./src/components/StoryModal.tsx', 'utf-8');

// Fix the malformed debug call
content = content.replace(
    /debug\.error\("StoryModal", "AI generation error", { value: { value: { value: { { error  } } } } }\);/g,
    'debug.error("StoryModal", "AI generation error", { error });'
);

// Write it back
fs.writeFileSync('./src/components/StoryModal.tsx', content);
console.log('Fixed StoryModal.tsx debug call');
