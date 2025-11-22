#!/bin/bash

# Stop Tambo Docker Stack
# This script stops the Tambo application and PostgreSQL database

set -e

# Get the root directory of the git repository
REPO_ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT_DIR" || { echo -e "Could not find repo root. Are you running from inside the tambo folder?"; exit 1; }

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if docker.env exists
if [ ! -f "docker.env" ]; then
    echo -e "${RED}❌ docker.env file not found!${NC}"
    echo -e "${YELLOW}📝 Please copy docker.env.example to docker.env and update with your values${NC}"
    exit 1
fi

echo -e "${YELLOW}🛑 Stopping Tambo Docker Stack...${NC}"

# Stop all services
echo -e "${BLUE}🎯 Stopping all services...${NC}"
docker compose --env-file docker.env down || true

# Remove network (only if no other containers are using it)
echo -e "${BLUE}🔗 Cleaning up network...${NC}"
docker network rm tambo_network 2>/dev/null || true

echo -e "${GREEN}✅ Tambo Docker Stack stopped successfully!${NC}"
echo -e "${YELLOW}💡 To start the stack again: ./scripts/cloud/tambo-start.sh${NC}" 