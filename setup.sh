#!/bin/bash

echo "🚀 Setting up LLMBridge locally..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed."
    echo "📥 Please install Ollama first:"
    echo "   1. Visit: https://ollama.ai"
    echo "   2. Download and install for your OS"
    echo "   3. Run: ollama pull llama2:7b"
    echo "   4. Then run this setup script again"
    exit 1
fi

echo "✅ Ollama found: $(ollama --version)"

# Check if Llama model is available
if ! ollama list | grep -q "llama2:7b"; then
    echo "📦 Downloading Llama 7B model..."
    ollama pull llama2:7b
    if [ $? -ne 0 ]; then
        echo "❌ Failed to download Llama model"
        exit 1
    fi
fi

echo "✅ Llama 7B model ready"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Create start script
cat > start-local.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting LLMBridge..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "🦙 Starting Ollama..."
    ollama serve &
    sleep 3
fi

echo "✅ Ollama is running"

# Start the application
echo "🌐 Starting LLMBridge application..."
npm run dev
EOF

chmod +x start-local.sh

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start LLMBridge:"
echo "  ./start-local.sh"
echo ""
echo "Or manually:"
echo "  1. Start Ollama: ollama serve"
echo "  2. Start app: npm run dev"
echo "  3. Open: http://localhost:5000"
echo ""
echo "📚 For more info, see README.md"