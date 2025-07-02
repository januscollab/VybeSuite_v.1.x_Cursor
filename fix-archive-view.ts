import * as fs from 'fs';

// Read the current file
let content = fs.readFileSync('./src/components/ArchiveView.tsx', 'utf-8');

// Fix the malformed debug call
content = content.replace(
    /debug\.error\("ArchiveView", "Error in restore and move operation", { value: { value: { value: { { error  } } } } }\);/g,
    'debug.error("ArchiveView", "Error in restore and move operation", { error });'
);

// Write it back
fs.writeFileSync('./src/components/ArchiveView.tsx', content);
console.log('Fixed ArchiveView.tsx debug call');
