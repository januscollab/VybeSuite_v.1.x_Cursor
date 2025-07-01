import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

// Import prompt files as raw text using Vite's raw import feature
import claudePrompt from '../../prompts/userstory_claude.txt?raw';
import chatgptPrompt from '../../prompts/userstory_chatgpt.txt?raw';
import claudeGithubPrompt from '../../prompts/userstory_claude_github.txt?raw';
import openSprintPromptRaw from '../../prompts/open_sprint.txt?raw';

interface PromptContextType {
  prompts: {
    claude: string;
    chatgpt: string;
    claudeGithub: string;
    openSprint: string;
    openSprintStoryFormat: string;
  };
  getStoryGenerationPrompt: (provider: 'openai' | 'anthropic', includeGithubCodeReview?: boolean) => string;
  getOpenSprintPromptTemplate: () => string;
  getOpenSprintStoryFormat: () => string;
  isLoaded: boolean;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const usePrompts = () => {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePrompts must be used within a PromptProvider');
  }
  return context;
};

export const PromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [prompts, setPrompts] = useState({
    claude: '',
    chatgpt: '',
    claudeGithub: '',
    openSprint: '',
    openSprintStoryFormat: ''
  });

  // Parse the open sprint prompt to extract story format
  const parseOpenSprintPrompt = (rawPrompt: string) => {
    // CRITICAL FIX: Remove all carriage return characters to normalize line endings
    const normalizedPrompt = rawPrompt.replace(/\r/g, '');
    
    const startDelimiter = '---STORY_ITEM_FORMAT_START---';
    const endDelimiter = '---STORY_ITEM_FORMAT_END---';
    
    const startIndex = normalizedPrompt.indexOf(startDelimiter);
    const endIndex = normalizedPrompt.indexOf(endDelimiter);
    
    if (startIndex === -1 || endIndex === -1) {
      console.warn('Story format delimiters not found in open sprint prompt, using default format');
      return {
        mainPrompt: normalizedPrompt,
        storyFormat: '{storyNumber}: {storyTitle}\nDescription: {storyDescription}\n------------\n'
      };
    }
    
    // Extract the story format (content between delimiters)
    const formatStart = startIndex + startDelimiter.length;
    const storyFormat = normalizedPrompt.substring(formatStart, endIndex).trim();
    
    // Remove the entire story format block from the main prompt
    const beforeFormat = normalizedPrompt.substring(0, startIndex);
    const afterFormat = normalizedPrompt.substring(endIndex + endDelimiter.length);
    const mainPrompt = (beforeFormat + afterFormat).trim();
    
    return {
      mainPrompt,
      storyFormat
    };
  };

  // Load prompts lazily when first requested (instead of immediately when user authenticates)
  const loadPromptsIfNeeded = () => {
    if (!isLoaded && user) {
      console.log('Loading AI prompts on-demand...');
      
      // Parse the open sprint prompt to separate main template from story format
      const { mainPrompt, storyFormat } = parseOpenSprintPrompt(openSprintPromptRaw);
      
      // Load the imported prompt content
      setPrompts({
        claude: claudePrompt,
        chatgpt: chatgptPrompt,
        claudeGithub: claudeGithubPrompt,
        openSprint: mainPrompt,
        openSprintStoryFormat: storyFormat
      });
      setIsLoaded(true);
      console.log('✅ AI prompts loaded successfully');
    }
  };

  // Reset prompts when user logs out
  useEffect(() => {
    if (!user) {
      setIsLoaded(false);
      setPrompts({
        claude: '',
        chatgpt: '',
        claudeGithub: '',
        openSprint: '',
        openSprintStoryFormat: ''
      });
    }
  }, [user]);

  const getStoryGenerationPrompt = (provider: 'openai' | 'anthropic', includeGithubCodeReview: boolean = false): string => {
    // Load prompts on-demand when first accessed
    loadPromptsIfNeeded();
    
    if (!isLoaded) {
      console.warn('Prompts not loaded yet, using fallback');
      return 'You are an expert Agile/Scrum story writer. Generate a user story based on the given prompt.';
    }

    switch (provider) {
      case 'anthropic':
        return includeGithubCodeReview ? prompts.claudeGithub : prompts.claude;
      case 'openai':
        return prompts.chatgpt;
      default:
        console.warn(`Unknown provider: ${provider}, using ChatGPT prompt as fallback`);
        return prompts.chatgpt;
    }
  };

  const getOpenSprintPromptTemplate = (): string => {
    // Load prompts on-demand when first accessed
    loadPromptsIfNeeded();
    
    if (!isLoaded) {
      console.warn('Prompts not loaded yet, using fallback');
      return 'Review and Provide a Build Plan for the following features for {sprintTitle} Sprint:\n\n{storyList}';
    }
    return prompts.openSprint;
  };

  const getOpenSprintStoryFormat = (): string => {
    // Load prompts on-demand when first accessed
    loadPromptsIfNeeded();
    
    if (!isLoaded) {
      console.warn('Prompts not loaded yet, using fallback story format');
      return '{storyNumber}: {storyTitle}\nDescription: {storyDescription}\n------------\n';
    }
    return prompts.openSprintStoryFormat;
  };

  const value = {
    prompts,
    getStoryGenerationPrompt,
    getOpenSprintPromptTemplate,
    getOpenSprintStoryFormat,
    isLoaded
  };

  return (
    <PromptContext.Provider value={value}>
      {children}
    </PromptContext.Provider>
  );
};