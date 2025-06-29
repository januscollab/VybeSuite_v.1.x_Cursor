import { useAuth } from '../contexts/AuthContext';
import { usePrompts } from '../contexts/PromptContext';

// Interface for prompt context
export interface PromptContext {
  sprintTitle: string;
  stories: Array<{
    number: string;
    title: string;
    description?: string;
  }>;
}

// Generate the Open Sprint prompt with dynamic content and story formatting
export function generateOpenSprintPrompt(
  template: string, 
  storyFormat: string, 
  context: PromptContext
): string {
  const { sprintTitle, stories } = context;
  
  // Generate story list using the dynamic story format
  const storyList = stories.map(story => {
    return storyFormat
      .replace('{storyNumber}', story.number)
      .replace('{storyTitle}', story.title)
      .replace('{storyDescription}', story.description || 'No description provided')
      // Handle multiple occurrences of placeholders
      .replace(/\{storyNumber\}/g, story.number)
      .replace(/\{storyTitle\}/g, story.title)
      .replace(/\{storyDescription\}/g, story.description || 'No description provided');
  }).join('\n\n');
  
  // Generate status list section for completion report
  const statusList = stories.map(story => 
    `✅ ${story.number}: ${story.title}`
  ).join('\n');
  
  // Replace placeholders in template
  return template
    .replace('{sprintTitle}', sprintTitle)
    .replace('{storyList}', storyList)
    .replace('{statusList}', statusList)
    // Additional replacements for backward compatibility
    .replace(/\{sprintTitle\}/g, sprintTitle)
    .replace(/\{storyList\}/g, storyList)
    .replace(/\{statusList\}/g, statusList);
}

// Hook to manage prompt state in auth context
export function usePromptManager() {
  const { user } = useAuth();
  const { 
    getOpenSprintPromptTemplate, 
    getOpenSprintStoryFormat, 
    isLoaded 
  } = usePrompts();
  
  // Get the Open Sprint prompt using the dynamic template and story format
  const getOpenSprintPrompt = (context: PromptContext): string => {
    const template = getOpenSprintPromptTemplate();
    const storyFormat = getOpenSprintStoryFormat();
    return generateOpenSprintPrompt(template, storyFormat, context);
  };
  
  // Future enhancement: Could store custom prompt templates in user settings
  const updatePromptTemplate = async (newTemplate: string): Promise<boolean> => {
    // This would be implemented when we add custom prompt templates to user settings
    console.log('Custom prompt templates not yet implemented:', newTemplate);
    return false;
  };
  
  return {
    getOpenSprintPrompt,
    updatePromptTemplate,
    isReady: !!user && isLoaded
  };
}

// Export the service functions
export const promptService = {
  generateOpenSprintPrompt,
  getDefaultTemplate: () => 'Review and Provide a Build Plan for the following features for {sprintTitle} Sprint:\n\n{storyList}',
  getDefaultStoryFormat: () => '{storyNumber}: {storyTitle}\nDescription: {storyDescription}\n------------\n'
};