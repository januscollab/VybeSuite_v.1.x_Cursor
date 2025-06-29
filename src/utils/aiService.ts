import { AIGenerationRequest, AIGenerationResponse } from '../types';

export class AIServiceError extends Error {
  constructor(message: string, public provider: string, public statusCode?: number) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export async function generateStoryWithOpenAI(
  prompt: string,
  apiKey: string,
  model: string
): Promise<AIGenerationResponse> {
  if (!apiKey.trim()) {
    throw new AIServiceError('OpenAI API key is required', 'openai');
  }

  const systemPrompt = `You are an expert Agile/Scrum story writer. Generate a user story based on the given prompt.

Return a JSON response with exactly this structure:
{
  "title": "As a [user type], I want [goal] so that [benefit]",
  "description": "Detailed description with acceptance criteria and technical requirements",
  "tags": ["tag1", "tag2", "tag3"]
}

Make the title follow proper user story format. Include detailed acceptance criteria and technical requirements in the description. Suggest 3-5 relevant tags.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AIServiceError(
        errorData.error?.message || `OpenAI API error: ${response.status}`,
        'openai',
        response.status
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new AIServiceError('No content received from OpenAI', 'openai');
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || `As a user, I want to ${prompt} so that I can achieve my goals`,
        description: parsed.description || `Implement: ${prompt}`,
        tags: Array.isArray(parsed.tags) ? parsed.tags : ['feature']
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        title: `As a user, I want to ${prompt} so that I can achieve my goals`,
        description: content,
        tags: ['feature', 'ai-generated']
      };
    }
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    throw new AIServiceError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'openai'
    );
  }
}

export async function generateStoryWithAnthropic(
  prompt: string,
  apiKey: string,
  model: string
): Promise<AIGenerationResponse> {
  if (!apiKey.trim()) {
    throw new AIServiceError('Anthropic API key is required', 'anthropic');
  }

  const systemPrompt = `You are an expert Agile/Scrum story writer. Generate a user story based on the given prompt.

Return a JSON response with exactly this structure:
{
  "title": "As a [user type], I want [goal] so that [benefit]",
  "description": "Detailed description with acceptance criteria and technical requirements",
  "tags": ["tag1", "tag2", "tag3"]
}

Make the title follow proper user story format. Include detailed acceptance criteria and technical requirements in the description. Suggest 3-5 relevant tags.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AIServiceError(
        errorData.error?.message || `Anthropic API error: ${response.status}`,
        'anthropic',
        response.status
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new AIServiceError('No content received from Anthropic', 'anthropic');
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || `As a user, I want to ${prompt} so that I can achieve my goals`,
        description: parsed.description || `Implement: ${prompt}`,
        tags: Array.isArray(parsed.tags) ? parsed.tags : ['feature']
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        title: `As a user, I want to ${prompt} so that I can achieve my goals`,
        description: content,
        tags: ['feature', 'ai-generated']
      };
    }
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    throw new AIServiceError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'anthropic'
    );
  }
}

export async function generateStory(request: AIGenerationRequest): Promise<AIGenerationResponse> {
  const { provider, model, prompt, apiKey } = request;

  if (provider === 'openai') {
    return generateStoryWithOpenAI(prompt, apiKey, model);
  } else if (provider === 'anthropic') {
    return generateStoryWithAnthropic(prompt, apiKey, model);
  } else {
    throw new AIServiceError(`Unsupported provider: ${provider}`, provider);
  }
}

export async function testConnection(provider: 'openai' | 'anthropic', apiKey: string, model: string): Promise<boolean> {
  try {
    await generateStory({
      provider,
      model,
      prompt: 'test connection',
      apiKey
    });
    return true;
  } catch (error) {
    console.error(`${provider} connection test failed:`, error);
    return false;
  }
}