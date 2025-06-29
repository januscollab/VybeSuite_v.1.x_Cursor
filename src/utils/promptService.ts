import { useAuth } from '../contexts/AuthContext';

// Default prompt template for Open Sprint functionality
const DEFAULT_OPEN_SPRINT_PROMPT = `Review and Provide a Build Plan for the following features for {sprintTitle} Sprint:

{storyList}

Prompt user with the following information and request permission to proceed prior to implementing any change
1. A Complete Plan for implementing the above story changes
2. Potential challenges and risks to these changes and solutions to overcome

On completion of changes please provide a full Completion Status Report for each story in the format below:

## Sprint Completion Status Report:
{statusList}

//Update the status of the story appropriately with ✅ or ❌`;

// Interface for prompt context
export interface PromptContext {
  sprintTitle: string;
  stories: Array<{
    number: string;
    title: string;
    description?: string;
  }>;
}

// Generate the Open Sprint prompt with dynamic content
export function generateOpenSprintPrompt(context: PromptContext): string {
  const { sprintTitle, stories } = context;
  
  // Generate story list section
  const storyList = stories.map(story => 
    `${story.number}: ${story.title}\nDescription: ${story.description || 'No description provided'}\n-----`
  ).join('\n\n');
  
  // Generate status list section
  const statusList = stories.map(story => 
    `✅ ${story.number}: ${story.title}`
  ).join('\n');
  
  // Replace placeholders in template
  return DEFAULT_OPEN_SPRINT_PROMPT
    .replace('{sprintTitle}', sprintTitle)
    .replace('{storyList}', storyList)
    .replace('{statusList}', statusList);
}

// Hook to manage prompt state in auth context
export function usePromptManager() {
  const { user } = useAuth();
  
  // Since we can't read files directly in browser, we'll use the template approach
  const getOpenSprintPrompt = (context: PromptContext): string => {
    return generateOpenSprintPrompt(context);
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
    isReady: !!user
  };
}

// Export the service functions
export const promptService = {
  generateOpenSprintPrompt,
  getDefaultTemplate: () => DEFAULT_OPEN_SPRINT_PROMPT
};