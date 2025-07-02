import * as fs from 'fs';

let content = fs.readFileSync('./src/hooks/useSupabaseStories.ts', 'utf-8');

// Fix the specific broken debug call on lines 287-291
content = content.replace(
    /debug\.info\("useSupabaseStories\.ts", "✅ Data loaded successfully", { {\s*sprintsCount sortedSprints\.length,\s*backlogExists: sortedSprints\.some\(s => s\.isBacklog\s*\)\),\s*priorityExists: sortedSprints\.some\(s => s\.id === 'priority'\)\s*}\);/s,
    'debug.info("useSupabaseStories.ts", "✅ Data loaded successfully", { sprintsCount: sortedSprints.length, backlogExists: sortedSprints.some(s => s.isBacklog), priorityExists: sortedSprints.some(s => s.id === "priority") });'
);

// Also fix the simpler pattern on line 287-291 if the above doesn't work
content = content.replace(
    /{ {\s*sprintsCount sortedSprints\.length,\s*backlogExists: sortedSprints\.some\(s => s\.isBacklog\s*\)\),\s*priorityExists: sortedSprints\.some\(s => s\.id === 'priority'\)\s*}/s,
    '{ sprintsCount: sortedSprints.length, backlogExists: sortedSprints.some(s => s.isBacklog), priorityExists: sortedSprints.some(s => s.id === "priority") }'
);

fs.writeFileSync('./src/hooks/useSupabaseStories.ts', content);
console.log('Fixed useSupabaseStories.ts final syntax issue');
