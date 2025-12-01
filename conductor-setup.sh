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

# Helper function to setup .env file
setup_env_file() {
  local path="$1"
  local warning="$2"

  # Skip if directory doesn't exist
  if [ ! -d "$path" ]; then
    return
  fi

  if [ -f "$CONDUCTOR_ROOT_PATH/$path/.env" ]; then
    echo "  - Copying $path/.env from root repo..."
    cp "$CONDUCTOR_ROOT_PATH/$path/.env" "$path/.env"
  elif [ ! -f "$path/.env" ] && [ -f "$path/.env.example" ]; then
    echo "  - Creating $path/.env from example..."
    cp "$path/.env.example" "$path/.env"
    if [ -n "$warning" ]; then
      echo "⚠️  WARNING: $warning"
    fi
  fi
}

setup_env_file "showcase" "You need to add your NEXT_PUBLIC_TAMBO_API_KEY to showcase/.env"
setup_env_file "docs" "You need to add your NEXT_PUBLIC_TAMBO_API_KEY to docs/.env"
setup_env_file "apps/web" "apps/web/.env created with defaults - update DATABASE_URL and API keys as needed"
setup_env_file "apps/api" "apps/api/.env created with defaults - update OPENAI_API_KEY and other secrets"
setup_env_file "packages/db" "packages/db/.env created with default DATABASE_URL"
setup_env_file "apps/docs-mcp" "apps/docs-mcp/.env created - set INKEEP_API_KEY if using MCP tools"

# Copy .plans directory if it exists in root repo
if [ -d "$CONDUCTOR_ROOT_PATH/.plans" ]; then
    echo "  - Copying .plans/ from root repo..."
    cp -r "$CONDUCTOR_ROOT_PATH/.plans" .
fi

# Build packages
echo "🔨 Building packages..."
npm run build

echo "✅ Workspace setup complete!"
