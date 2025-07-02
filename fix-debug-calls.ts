import * as fs from 'fs';
import * as path from 'path';

const baseDir = './src';

function fixDebugFile() {
  const debugPath = path.join(baseDir, 'utils', 'debug.ts');
  const newContent = `/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_LOG_LEVEL?: string;
  MODE?: string;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogContext {
  timestamp?: string;
  [key: string]: any;
}

let currentLogLevel = LogLevel.INFO;

// Try to get log level from env, fallback to INFO if not set
try {
  const envLevel = import.meta.env.VITE_LOG_LEVEL;
  if (typeof envLevel === 'string') {
    currentLogLevel = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO;
  }
} catch {
  // Fallback to INFO if env variable is not set
  currentLogLevel = LogLevel.INFO;
}

function formatLogMessage(level: string, component: string, message: string, context: LogContext = {}) {
  return {
    level,
    component,
    message,
    timestamp: new Date().toISOString(),
    ...context
  };
}

export const debug = {
  setLogLevel(level: LogLevel) {
    currentLogLevel = level;
  },

  getLogLevel(): LogLevel {
    return currentLogLevel;
  },

  debug(component: string, message: string, context: LogContext = {}) {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.debug(formatLogMessage('DEBUG', component, message, context));
    }
  },

  info(component: string, message: string, context: LogContext = {}) {
    if (currentLogLevel <= LogLevel.INFO) {
      console.info(formatLogMessage('INFO', component, message, context));
    }
  },

  warn(component: string, message: string, context: LogContext = {}) {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(formatLogMessage('WARN', component, message, context));
    }
  },

  error(component: string, message: string, context: LogContext = {}) {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(formatLogMessage('ERROR', component, message, context));
    }
  }
};`;

  fs.writeFileSync(debugPath, newContent);
  console.log('Updated debug.ts');
}

function fixDebugCalls(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix debug calls with optional chaining and complex objects
  content = content.replace(
    /debug\.(error|info|warn|debug)\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*{\s*([^}]+)\s*}\)/g,
    (match, level, component, message, context) => {
      // Clean up the context by removing optional chaining
      const cleanContext = context
        .split(',')
        .map((item: string) => {
          const [key, value] = item.split(':').map(s => s.trim());
          // If there's optional chaining, create a new variable name
          if (value && value.includes('?.')) {
            const parts = value.split('?.');
            const baseName = parts[0];
            const chainedProps = parts.slice(1).join('.');
            return `${key}: ${value}`;
          }
          return item;
        })
        .join(', ');

      return `debug.${level}("${component}", "${message}", { ${cleanContext} })`;
    }
  );

  // Fix debug calls with colons in message
  content = content.replace(
    /debug\.(error|info|warn|debug)\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+):["']\s*,\s*([^)]+)\)/g,
    (match, level, component, message, variable) => {
      const varName = variable.trim();
      return `debug.${level}("${component}", "${message}", { ${varName} })`;
    }
  );

  // Fix simple debug calls with direct variables
  content = content.replace(
    /debug\.(error|info|warn|debug)\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*([^{][^)]+)\)/g,
    (match, level, component, message, variable) => {
      const varName = variable.trim();
      if (varName.includes('?.')) {
        const parts = varName.split('?.');
        const baseName = parts[0];
        return `debug.${level}("${component}", "${message}", { ${baseName} })`;
      }
      return `debug.${level}("${component}", "${message}", { value: ${varName} })`;
    }
  );

  // Fix debug calls with string concatenation
  content = content.replace(
    /debug\.(error|info|warn|debug)\s*\(\s*["']([^"']+)["']\s*,\s*`([^`]+)`\s*\)/g,
    (match, level, component, template) => {
      const message = template.replace(/\${([^}]+)}/g, (_, expr) => {
        return `" + ${expr} + "`;
      });
      return `debug.${level}("${component}", "${message}")`;
    }
  );

  fs.writeFileSync(filePath, content);
  console.log(`Updated debug calls in ${filePath}`);
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
  console.log('Starting fixes...');
  
  // Fix debug.ts first
  fixDebugFile();
  
  // Then fix all debug calls in TypeScript files
  const files = findTypeScriptFiles(baseDir);
  console.log(`Found ${files.length} TypeScript files`);
  
  for (const file of files) {
    fixDebugCalls(file);
  }
  
  console.log('All fixes completed successfully!');
} catch (error) {
  console.error('Error applying fixes:', error);
  process.exit(1);
}