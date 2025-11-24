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

# Showcase .env
if [ -f "$CONDUCTOR_ROOT_PATH/showcase/.env" ]; then
    echo "  - Copying showcase/.env from root repo..."
    cp "$CONDUCTOR_ROOT_PATH/showcase/.env" showcase/.env
elif [ ! -f "showcase/.env" ]; then
    echo "  - Creating showcase/.env from example..."
    cp showcase/.env.example showcase/.env
    echo "⚠️  WARNING: You need to add your NEXT_PUBLIC_TAMBO_API_KEY to showcase/.env"
fi

# Docs .env
if [ -f "$CONDUCTOR_ROOT_PATH/docs/.env" ]; then
    echo "  - Copying docs/.env from root repo..."
    cp "$CONDUCTOR_ROOT_PATH/docs/.env" docs/.env
elif [ ! -f "docs/.env" ]; then
    echo "  - Creating docs/.env from example..."
    cp docs/.env.example docs/.env
    echo "⚠️  WARNING: You need to add your NEXT_PUBLIC_TAMBO_API_KEY to docs/.env"
fi

# Apps/Web .env (Tambo Cloud frontend)
if [ -f "$CONDUCTOR_ROOT_PATH/apps/web/.env" ]; then
    echo "  - Copying apps/web/.env from root repo..."
    cp "$CONDUCTOR_ROOT_PATH/apps/web/.env" apps/web/.env
elif [ ! -f "apps/web/.env" ]; then
    echo "  - Creating apps/web/.env from example..."
    cp apps/web/.env.example apps/web/.env
    echo "⚠️  WARNING: apps/web/.env created with defaults - update DATABASE_URL and API keys as needed"
fi

# Apps/API .env (Tambo Cloud backend)
if [ -f "$CONDUCTOR_ROOT_PATH/apps/api/.env" ]; then
    echo "  - Copying apps/api/.env from root repo..."
    cp "$CONDUCTOR_ROOT_PATH/apps/api/.env" apps/api/.env
elif [ ! -f "apps/api/.env" ]; then
    echo "  - Creating apps/api/.env from example..."
    cp apps/api/.env.example apps/api/.env
    echo "⚠️  WARNING: apps/api/.env created with defaults - update OPENAI_API_KEY and other secrets"
fi

# Packages/DB .env (Database connection)
if [ -f "$CONDUCTOR_ROOT_PATH/packages/db/.env" ]; then
    echo "  - Copying packages/db/.env from root repo..."
    cp "$CONDUCTOR_ROOT_PATH/packages/db/.env" packages/db/.env
elif [ ! -f "packages/db/.env" ]; then
    echo "  - Creating packages/db/.env from example..."
    cp packages/db/.env.example packages/db/.env
    echo "⚠️  WARNING: packages/db/.env created with default DATABASE_URL"
fi

# Apps/docs-mcp .env (optional - MCP documentation server)
if [ -f "$CONDUCTOR_ROOT_PATH/apps/docs-mcp/.env" ]; then
    echo "  - Copying apps/docs-mcp/.env from root repo..."
    cp "$CONDUCTOR_ROOT_PATH/apps/docs-mcp/.env" apps/docs-mcp/.env
elif [ ! -f "apps/docs-mcp/.env" ]; then
    echo "  - Creating apps/docs-mcp/.env from example..."
    cp apps/docs-mcp/.env.example apps/docs-mcp/.env
    echo "⚠️  WARNING: apps/docs-mcp/.env created - set INKEEP_API_KEY if using MCP tools"
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
