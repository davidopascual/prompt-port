# LLMBridge - Quick Start Guide

## Prerequisites

1. **Node.js v18+**: `node --version`
2. **Ollama with Llama 7B**: `ollama list | grep llama2:7b`

## Setup (Automated)

```bash
# Make setup script executable and run it
chmod +x setup.sh
./setup.sh
```

## Manual Setup

```bash
# Install dependencies
npm install

# Start Ollama (if not running)
ollama serve &

# Start the application
npm run dev
```

## Open Application

Navigate to: http://localhost:5000

## Troubleshooting

- **Ollama not found**: Install from https://ollama.ai
- **Model missing**: Run `ollama pull llama2:7b`
- **Port 5000 busy**: Kill process or change port in vite.config.ts
- **API errors**: Check Ollama is running on localhost:11434

## Privacy Features

- ✅ 100% local processing with Ollama
- ✅ No external API calls for memory extraction
- ✅ Data stays on your machine
- ✅ No telemetry or tracking
