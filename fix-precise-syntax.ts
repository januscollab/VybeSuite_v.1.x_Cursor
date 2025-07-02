import * as fs from 'fs';

let content = fs.readFileSync('./src/hooks/useSupabaseStories.ts', 'utf-8');

// Replace the exact malformed text
const malformedText = `debug.info("useSupabaseStories.ts", "✅ Data loaded successfully", { {
                    sprintsCount sortedSprints.length, 
                    backlogExists: sortedSprints.some(s => s.isBacklog  }),
                    priorityExists: sortedSprints.some(s => s.id === 'priority')
                });`;

const fixedText = `debug.info("useSupabaseStories.ts", "✅ Data loaded successfully", { 
                    sprintsCount: sortedSprints.length, 
                    backlogExists: sortedSprints.some(s => s.isBacklog),
                    priorityExists: sortedSprints.some(s => s.id === 'priority')
                });`;

content = content.replace(malformedText, fixedText);

// Also fix other simple issues in this file
content = content.replace(/{ storyNumber  }/g, '{ storyNumber }');
content = content.replace(/{ err  }/g, '{ err }');

fs.writeFileSync('./src/hooks/useSupabaseStories.ts', content);
console.log('Fixed the precise syntax issues');
