#!/bin/bash

# Fix parent directory aiService debug calls
sed -i.bak 's/debug\.info('\''OpenAI Raw Response'\'', {$/debug.info('\''OpenAI'\'', `Response: ${model}, content: ${content?.length || 0} chars`, {/' ../src/utils/aiService.ts
sed -i.bak 's/debug\.info('\''OpenAI Cleaned Content'\'', { content: cleanContent });/debug.info('\''OpenAI'\'', `Cleaned: ${cleanContent.substring(0, 50)}...`, { content: cleanContent });/' ../src/utils/aiService.ts
sed -i.bak 's/debug\.warn('\''OpenAI generated description appears incomplete'\'', {$/debug.warn('\''OpenAI'\'', `Incomplete description: ${description.length} chars`, {/' ../src/utils/aiService.ts
sed -i.bak 's/debug\.warn('\''Failed to parse AI response as JSON'\'', { error: parseError });/debug.warn('\''OpenAI'\'', `Parse failed: ${parseError instanceof Error ? parseError.message : "Unknown"}`, { error: parseError });/' ../src/utils/aiService.ts
sed -i.bak 's/debug\.info('\''Anthropic Raw Response'\'', {$/debug.info('\''Anthropic'\'', `Response: ${model}, content: ${content?.length || 0} chars`, {/' ../src/utils/aiService.ts
sed -i.bak 's/debug\.info('\''Anthropic Cleaned Content'\'', { content: cleanContent });/debug.info('\''Anthropic'\'', `Cleaned: ${cleanContent.substring(0, 50)}...`, { content: cleanContent });/' ../src/utils/aiService.ts
sed -i.bak 's/debug\.warn('\''Anthropic generated description appears incomplete'\'', {$/debug.warn('\''Anthropic'\'', `Incomplete description: ${description.length} chars`, {/' ../src/utils/aiService.ts

# Fix parent directory debug utility
cat > ../src/utils/debug.ts << 'DEBUGEOF'
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
  },

  group(label: string) {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.group(label);
    }
  },

  groupEnd() {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.groupEnd();
    }
  },

  log(component: string, message: string, context: LogContext = {}) {
    this.info(component, message, context);
  }
};
DEBUGEOF

echo "Fixed parent directory files"
