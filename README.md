# @heycool/n8n-nodes-plus

This is a personal collection of n8n community nodes that adds enhanced functionality to your n8n workflows.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Included Nodes

### Node - LmChatGoogleGeminiPlus

An enhanced version of the official Google Gemini node with the following improvements:

- **Network Proxy Support**: Fixes the issue where the official Gemini node doesn't work with network proxies
- **Google Search Integration**: Adds support for Google Search capability, allowing the model to search the web for relevant information
- **Debug Mode**: Includes a debug mode option for additional logging in the terminal

But it does not support the following features:

- **AI Agent**
- **Chat Messages**

## Credentials

The nodes in this collection use the following credentials:

### Google Palm API

To use the Google Gemini node, you need a Google API key:

1. Visit the [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Use this API key in the n8n credentials configuration

## Compatibility

Requires n8n version 1.0.0 or later.

Node.js >= 20.15 is required.

## Usage

### Usage - LmChatGoogleGeminiPlus

1. Add the "Google Gemini Chat Model Plus" node to your workflow
2. Configure your Google Palm API credentials
3. Select your preferred model (default is gemini-1.0-pro)
4. Toggle "Enable Google Search" if you want the model to have web search capability
5. Adjust additional options like temperature, tokens, etc. as needed
6. Connect to AI Chain, AI Agent, or other compatible nodes

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Google Gemini API Documentation](https://ai.google.dev/docs/gemini_api_overview)
- [GitHub Repository](https://github.com/ZxBing0066/n8n-nodes)

## Version history

- **0.1.0**: Initial release with LmChatGoogleGeminiPlus node
- **0.2.0**: Added debug mode
