import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

// Import prompt files as raw text using Vite's raw import feature
import claudePrompt from '../../prompts/userstory_claude.txt?raw';
import chatgptPrompt from '../../prompts/userstory_chatgpt.txt?raw';
import claudeGithubPrompt from '../../prompts/userstory_claude_github.txt?raw';

interface PromptContextType {
  prompts: {
    claude: string;
    chatgpt: string;
    claudeGithub: string;
  };
  getStoryGenerationPrompt: (provider: 'openai' | 'anthropic', includeGithubCodeReview?: boolean) => string;
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
    claudeGithub: ''
  });

  // Load prompts when user is authenticated
  useEffect(() => {
    if (user) {
      // Load the imported prompt content
      setPrompts({
        claude: claudePrompt,
        chatgpt: chatgptPrompt,
        claudeGithub: claudeGithubPrompt
      });
      setIsLoaded(true);
      console.log('AI prompts loaded successfully');
    } else {
      setIsLoaded(false);
      setPrompts({
        claude: '',
        chatgpt: '',
        claudeGithub: ''
      });
    }
  }, [user]);

  const getStoryGenerationPrompt = (provider: 'openai' | 'anthropic', includeGithubCodeReview: boolean = false): string => {
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

  const value = {
    prompts,
    getStoryGenerationPrompt,
    isLoaded
  };

  return (
    <PromptContext.Provider value={value}>
      {children}
    </PromptContext.Provider>
  );
};