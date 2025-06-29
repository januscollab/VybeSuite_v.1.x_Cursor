# AI API Integration Setup for Bolt

Please help me create a comprehensive AI assistant integration system with the following requirements:

## Core Features Needed:
1. **Settings Management**: Create a settings page/component where users can securely store API credentials
2. **Multi-Provider Support**: Support for both Claude (Anthropic) and ChatGPT (OpenAI) APIs
3. **Provider Selection**: Allow users to select which AI provider to use for each request
4. **Secure Credential Storage**: Implement secure local storage for API keys
5. **API Integration**: Working connections to both services

## Specific Implementation Requirements:

### 1. Settings Component
- Create a settings interface with fields for:
  - Anthropic API Key (for Claude)
  - OpenAI API Key (for ChatGPT)
  - Default provider selection
- Include validation for API key formats
- Add test connection buttons for each provider
- Implement secure storage (encrypted if possible, or at minimum browser localStorage with warnings)

### 2. API Service Layer
- Create service functions for both providers:
  - **Claude API**: Use endpoint `https://api.anthropic.com/v1/messages` with model `claude-3-5-sonnet-20241022`
  - **OpenAI API**: Use standard OpenAI chat completions endpoint
- Implement proper error handling and rate limiting
- Add request/response logging for debugging

### 3. Provider Selection UI
- Add a dropdown or toggle to select between Claude and ChatGPT
- Show current provider status and connection health
- Allow switching providers mid-conversation

### 4. Chat Interface Integration
- Modify the chat interface to work with both providers
- Handle different response formats from each API
- Maintain conversation history regardless of provider switches
- Add visual indicators showing which AI is responding

## Technical Specifications:

### Claude API Integration:
```javascript
// Example request format needed:
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user", 
      "content": "Hello, Claude"
    }
  ]
}
```

### Required Headers:
- `x-api-key`: Your Anthropic API key
- `Content-Type`: application/json
- `anthropic-version`: 2023-06-01

### OpenAI API Integration:
- Use standard OpenAI chat completions format
- Support for GPT-4 and GPT-3.5-turbo models
- Proper authentication with Bearer token

## Security Considerations:
- Never expose API keys in client-side code
- Implement proper error handling for invalid/expired keys
- Add warnings about API key security
- Consider implementing a backend proxy for additional security

## UI/UX Requirements:
- Clean, intuitive settings interface
- Clear provider switching mechanism  
- Status indicators for API connection health
- Responsive design that works on mobile and desktop
- Error messages that are user-friendly

## Additional Features:
- Cost tracking/estimation for API usage
- Conversation export functionality
- Model selection within each provider (e.g., different Claude or GPT models)
- Custom system prompts for each provider

Please implement this as a complete, working solution with proper error handling, user feedback, and a polished interface. Include setup instructions and any necessary environment variables or configuration steps.