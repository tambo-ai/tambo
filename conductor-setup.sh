#!/bin/bash
set -e

echo "🚀 Setting up Tambo workspace..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install Node.js >=22 and npm >=11"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Error: Node.js version must be >=22 (current: $(node -v))"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Setup .env files
echo "🔧 Setting up environment files..."

# Check if .env files exist in root repo
if [ -f "$CONDUCTOR_ROOT_PATH/showcase/.env" ]; then
    echo "  - Copying showcase/.env from root repo..."
    cp "$CONDUCTOR_ROOT_PATH/showcase/.env" showcase/.env
elif [ ! -f "showcase/.env" ]; then
    echo "  - Creating showcase/.env from example..."
    cp showcase/.env.example showcase/.env
    echo "⚠️  WARNING: You need to add your NEXT_PUBLIC_TAMBO_API_KEY to showcase/.env"
fi

if [ -f "$CONDUCTOR_ROOT_PATH/docs/.env" ]; then
    echo "  - Copying docs/.env from root repo..."
    cp "$CONDUCTOR_ROOT_PATH/docs/.env" docs/.env
elif [ ! -f "docs/.env" ]; then
    echo "  - Creating docs/.env from example..."
    cp docs/.env.example docs/.env
    echo "⚠️  WARNING: You need to add your NEXT_PUBLIC_TAMBO_API_KEY to docs/.env"
fi

# Copy .plans directory if it exists in root repo
if [ -d "$CONDUCTOR_ROOT_PATH/.plans" ]; then
    echo "  - Copying .plans/ from root repo..."
    cp -r "$CONDUCTOR_ROOT_PATH/.plans" .
fi

# Build packages
echo "🔨 Building packages..."
npm run build

echo "✅ Workspace setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Make sure you have your TAMBO_API_KEY set in showcase/.env and docs/.env"
echo "  2. Click 'Run' to start the dev servers (showcase + docs)"
