#!/bin/bash

# Setup Tambo Docker Environment
# This script helps set up the Tambo Docker environment for the first time

set -e

. "$(cd "$(dirname "$0")" && pwd)/_cloud-helpers.sh"

ensure_repo_root
cd "$REPO_ROOT_DIR" || fail "Could not find repo root. Are you running from inside the tambo folder?"

info "🚀 Tambo Docker Setup"
info "This script will help you set up Tambo for self-hosting with Docker"
info "📁 Working directory: $(pwd)"
printf '\n'

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    fail \
      "❌ Docker is not installed. Please install Docker first." \
      "💡 Visit: https://docs.docker.com/get-docker/"
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    fail \
      "❌ Docker Compose is not installed. Please install Docker Compose first." \
      "💡 Visit: https://docs.docker.com/compose/install/"
fi

info "✅ Prerequisites check passed!"
printf '\n'

# Create docker.env from example if it doesn't exist
if [ ! -f "docker.env" ]; then
    warn "📝 Creating docker.env from example..."
    if [ -f "docker.env.example" ]; then
        cp docker.env.example docker.env
        info "✅ docker.env created successfully!"
    else
        fail "❌ docker.env.example not found!"
    fi
else
    info "ℹ️  docker.env already exists"
fi

success \
  "✅ Setup completed successfully!" \
  "" \
  "📋 Next steps:" \
  "1. Edit docker.env with your actual values:" \
  "   - Update passwords and secrets" \
  "   - Add your API keys (OpenAI, etc.)" \
  "   - Configure other settings as needed" \
  "" \
  "2. Build the containers:" \
  "   ./scripts/cloud/tambo-build.sh" \
  "" \
  "3. Start the stack:" \
  "   ./scripts/cloud/tambo-start.sh" \
  "" \
  "4. Initialize the database:" \
  "   ./scripts/cloud/init-database.sh" \
  "" \
  "5. Access your applications:" \
  "   - Tambo Web: http://localhost:3210" \
  "   - Tambo API: http://localhost:3211" \
  "   - PostgreSQL Database: localhost:5433" \
  "" \
  "💡 For help, run: ./scripts/cloud/tambo-logs.sh --help" 
