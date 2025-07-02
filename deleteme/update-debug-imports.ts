import * as fs from 'fs';
import * as path from 'path';

const baseDir = './src';

function updateImportPath(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(path.dirname(filePath), path.join(baseDir, 'utils'));
  const normalizedPath = relativePath.replace(/\\/g, '/') || '.';
  
  // Replace any debug import with the correct relative path
  const newContent = content.replace(
    /import\s*{\s*debug\s*}\s*from\s*['"].*debug['"]/,
    `import { debug } from '${normalizedPath}/debug'`
  );

  if (content !== newContent) {
    console.log(`Updating imports in: ${filePath}`);
    fs.writeFileSync(filePath, newContent);
  }
}

function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findTypeScriptFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
try {
  const files = findTypeScriptFiles(baseDir);
  console.log(`Found ${files.length} TypeScript files`);
  
  for (const file of files) {
    updateImportPath(file);
  }
  
  console.log('Import paths updated successfully!');
} catch (error) {
  console.error('Error updating import paths:', error);
}
