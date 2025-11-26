#!/bin/bash
set -e

# Function to start Supabase if needed
start_supabase_if_needed() {
  if command -v supabase &> /dev/null; then
    echo "🗄️  Checking Supabase status..."
    # Use timeout to prevent hanging if Docker isn't running
    if ! timeout 10 supabase status &> /dev/null; then
      echo "🗄️  Starting Supabase..."
      if ! supabase start; then
        echo "❌ Failed to start Supabase. Common issues:"
        echo "   - Docker not running (start Docker Desktop)"
        echo "   - supabase not initialized (run 'supabase init')"
        echo "   - Port conflicts (check if ports 54322-54328 are available)"
        exit 1
      fi
    else
      echo "✓ Supabase already running"
    fi
  else
    echo "⚠️  WARNING: Supabase CLI not installed. Install with: brew install supabase/tap/supabase"
    echo "⚠️  You'll need to manually set up your database or install Supabase CLI"
  fi
}

echo "🚀 Tambo Development Server Options"
echo ""
echo "Select what to run:"
echo "  1) Full dev (everything - showcase + docs + web + api)"
echo "  2) Framework only (showcase + docs)"
echo "  3) Cloud only (web + api)"
echo "  4) Showcase only"
echo "  5) Docs only"
echo "  6) Web only"
echo "  7) API only"
echo ""
read -p "Enter your choice (1-7): " choice

case $choice in
  1)
    echo "Starting full dev (everything)..."
    start_supabase_if_needed
    npx turbo dev --filter=@tambo-ai/showcase --filter=@tambo-ai/docs --filter=@tambo-ai-cloud/web --filter=@tambo-ai-cloud/api
    ;;
  2)
    echo "Starting framework only (showcase + docs)..."
    npx turbo dev --filter=@tambo-ai/showcase --filter=@tambo-ai/docs
    ;;
  3)
    echo "Starting cloud only (web + api)..."
    start_supabase_if_needed
    npx turbo dev --filter=@tambo-ai-cloud/web --filter=@tambo-ai-cloud/api
    ;;
  4)
    echo "Starting showcase only..."
    npx turbo dev --filter=@tambo-ai/showcase
    ;;
  5)
    echo "Starting docs only..."
    npx turbo dev --filter=@tambo-ai/docs
    ;;
  6)
    echo "Starting web only..."
    start_supabase_if_needed
    npx turbo dev --filter=@tambo-ai-cloud/web
    ;;
  7)
    echo "Starting API only..."
    start_supabase_if_needed
    npx turbo dev --filter=@tambo-ai-cloud/api
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac
