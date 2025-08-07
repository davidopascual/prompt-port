# PromptPort - Privacy-First AI Memory Transfer & Prompt Generation

PromptPort is a privacy-first tool that extracts your "AI memory" (identity, preferences, interests, facts) from ChatGPT exports using local processing with Ollama, and generates personalized prompts for multiple LLMs including Claude, Gemini, ChatGPT, Grok, and more.

## Features

- **Privacy-First**: All processing happens locally on your machine
- **File Upload**: Support for ChatGPT export files (JSON, ZIP, TXT)
- **Memory Extraction**: Uses Ollama Llama models for local LLM processing
- **Multi-LLM Support**: Creates personalized prompts for Claude, Gemini, ChatGPT, Grok, Perplexity, and other LLMs
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Ollama** with Llama 7B model

### Installing Ollama

1. Visit [https://ollama.ai](https://ollama.ai) and download Ollama for your operating system
2. Install and start Ollama
3. Pull the Llama 7B model:
   ```bash
   ollama pull llama2:7b
   ```
4. Verify it's running:
   ```bash
   ollama list
   ```

## Local Setup

1. **Clone/Download the project**
   ```bash
   # If you have the project files locally
   cd llmbridge-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5000`
   - The app should load with the LLMBridge interface

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript types
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data storage
├── shared/                # Shared types and schemas
└── package.json           # Dependencies and scripts
```

## Usage

1. **Upload your ChatGPT export file**
   - Export your ChatGPT conversations from OpenAI
   - Drag and drop or click to upload the file

2. **Memory extraction**
   - The app processes your conversations locally using Ollama
   - No data is sent to external servers

3. **Review your memory profile**
   - View extracted identity, preferences, and interests
   - Edit any details if needed

4. **Generate prompts**
   - Select your target LLM (Claude, Gemini, etc.)
   - Copy the generated prompt to use with other AI assistants

## Configuration

The app automatically connects to Ollama running on `localhost:11434`. If you need to change this, modify the configuration in:
- `server/routes.ts` - Update the Ollama API endpoint

## Troubleshooting

### Ollama not responding
- Make sure Ollama is running: `ollama serve`
- Check if the model is available: `ollama list`
- Verify the port (default: 11434)

### Application won't start
- Ensure Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check for port conflicts (default: 5000)

### File upload issues
- Supported formats: JSON, ZIP, TXT
- Maximum file size: 100MB
- Ensure the file is a valid ChatGPT export

## Privacy & Security

- **No external API calls** for memory extraction
- **Local processing only** using your Ollama installation
- **No data storage** beyond the current session
- **Open source** - you can review all code

## Contributing

This is a local development project. Feel free to modify the code to suit your needs.

## License

MIT License - feel free to use and modify as needed.