import * as fs from 'fs';
import * as path from 'path';

function fixAllDebugCalls(dir: string) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      fixAllDebugCalls(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const originalContent = content;
      
      // Fix all the malformed debug calls with nested braces
      content = content.replace(
        /debug\.(error|info|warn|debug)\("([^"]+)", "([^"]+)", { value: { value: { value: { { ([^}]+) } } } } }\);/g,
        'debug.$1("$2", "$3", { $4 });'
      );
      
      content = content.replace(
        /debug\.(error|info|warn|debug)\("([^"]+)", "([^"]+)", { value: { value: { { { ([^}]+) } } }\);/g,
        'debug.$1("$2", "$3", { $4 });'
      );
      
      content = content.replace(
        /debug\.(error|info|warn|debug)\("([^"]+)", "([^"]+)", { value: { { { ([^}]+) } } }\);/g,
        'debug.$1("$2", "$3", { $4 });'
      );
      
      // Fix any remaining malformed patterns
      content = content.replace(
        /{ value: { value: { value: { { ([^}]+)\s+} } } } }/g,
        '{ $1 }'
      );
      
      content = content.replace(
        /{ value: { value: { { { ([^}]+)\s+} } }/g,
        '{ $1 }'
      );
      
      content = content.replace(
        /{ value: { { { ([^}]+)\s+} } }/g,
        '{ $1 }'
      );
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed debug calls in: ${fullPath}`);
      }
    }
  }
}

fixAllDebugCalls('./src');
console.log('Fixed all malformed debug calls!');
