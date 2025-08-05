#!/bin/bash

# Update Supabase Docker Compose
# This script fetches the latest Supabase docker-compose.yml from their GitHub repository

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root directory
cd "$PROJECT_ROOT"

SUPABASE_REPO="https://github.com/supabase/supabase"
SUPABASE_DOCKER_PATH="docker"
SUPABASE_BRANCH="master"
DOCKER_DIR="./docker/supabase"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is not available. Please install curl first.${NC}"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not available. Please install jq first.${NC}"
    exit 1
fi

# Check if docker.env exists
if [ ! -f "docker.env" ]; then
    echo -e "${RED}❌ docker.env file not found!${NC}"
    echo -e "${YELLOW}📝 Please copy docker.env.example to docker.env and update with your values${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Updating Supabase Docker Compose files...${NC}"

# Create docker directory if it doesn't exist
mkdir -p "$DOCKER_DIR"

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${YELLOW}📦 Downloading latest Supabase Docker files...${NC}"

# Download the entire docker directory from Supabase repository
curl -s -L "https://api.github.com/repos/supabase/supabase/contents/docker" | \
  jq -r '.[] | select(.type == "file") | .download_url' | \
  while read -r url; do
    filename=$(basename "$url")
    echo "  - Downloading $filename..."
    curl -s -L "$url" -o "$TEMP_DIR/$filename"
  done

# Download subdirectories
for subdir in "volumes" "migrations"; do
  if curl -s -L "https://api.github.com/repos/supabase/supabase/contents/docker/$subdir" | jq -e '. | length > 0' > /dev/null 2>&1; then
    echo "  - Downloading $subdir directory..."
    mkdir -p "$TEMP_DIR/$subdir"
    curl -s -L "https://api.github.com/repos/supabase/supabase/contents/docker/$subdir" | \
      jq -r '.[] | select(.type == "file") | .download_url' | \
      while read -r url; do
        filename=$(basename "$url")
        curl -s -L "$url" -o "$TEMP_DIR/$subdir/$filename"
      done
  fi
done

# Copy files to our docker directory
echo -e "${YELLOW}📋 Copying files to $DOCKER_DIR...${NC}"
cp -r "$TEMP_DIR"/* "$DOCKER_DIR/"

# Create a timestamp file
echo "Last updated: $(date)" > "$DOCKER_DIR/last_updated.txt"

echo -e "${GREEN}✅ Supabase Docker files updated successfully!${NC}"
echo -e "${YELLOW}📁 Files location: $DOCKER_DIR${NC}"
echo -e "${YELLOW}📝 To use these files, run: docker compose -f $DOCKER_DIR/docker-compose.yml up${NC}"

# Check if docker-compose.yml exists
if [ -f "$DOCKER_DIR/docker-compose.yml" ]; then
    echo -e "${GREEN}✅ docker-compose.yml found and ready to use${NC}"
else
    echo -e "${RED}❌ docker-compose.yml not found in downloaded files${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Done!${NC}" 