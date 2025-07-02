import * as fs from 'fs';

// Read the current file
let content = fs.readFileSync('./src/components/OpenSprintModal.tsx', 'utf-8');

// Fix the malformed debug call
content = content.replace(
    /debug\.info\("OpenSprintModal", "Generated Prompt Content \(copy this string\)", { value: { value: { value: { { generatedPrompt  } } } } }\);/g,
    'debug.info("OpenSprintModal", "Generated Prompt Content (copy this string)", { generatedPrompt });'
);

// Write it back
fs.writeFileSync('./src/components/OpenSprintModal.tsx', content);
console.log('Fixed OpenSprintModal.tsx debug call');
