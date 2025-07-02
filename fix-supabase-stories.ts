import * as fs from 'fs';

// Read the current file
let content = fs.readFileSync('./src/hooks/useSupabaseStories.ts', 'utf-8');

// Fix the specific malformed debug call
content = content.replace(
    /debug\.info\("useSupabaseStories\.ts", "✅ Data loaded successfully", { {\s*sprintsCount sortedSprints\.length,\s*backlogExists: sortedSprints\.some\(s => s\.isBacklog\s*\)\),\s*priorityExists: sortedSprints\.some\(s => s\.id === 'priority'\)\s*}\);/gs,
    'debug.info("useSupabaseStories.ts", "✅ Data loaded successfully", { sprintsCount: sortedSprints.length, backlogExists: sortedSprints.some(s => s.isBacklog), priorityExists: sortedSprints.some(s => s.id === \'priority\') });'
);

// Fix any other malformed patterns in this file
content = content.replace(
    /{ {\s*([^}]+)\s*}\);/g,
    '{ $1 });'
);

// Fix variable assignments without colons
content = content.replace(
    /{ ([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_.()]+),/g,
    '{ $1: $2,'
);

// Write it back
fs.writeFileSync('./src/hooks/useSupabaseStories.ts', content);
console.log('Fixed useSupabaseStories.ts debug calls');
