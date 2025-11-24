#!/bin/bash

# Start Tambo Docker Stack
# This script starts the Tambo application with PostgreSQL database

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if REPO_ROOT_DIR="$("$SCRIPT_DIR"/../find-repo-root.sh "$SCRIPT_DIR")"; then
  :
else
  # Helper already printed a detailed error message
  exit 1
fi

cd "$REPO_ROOT_DIR" || { echo -e "Could not find repo root. Are you running from inside the tambo folder?" >&2; exit 1; }

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Tambo Docker Stack...${NC}"
echo -e "${BLUE}📁 Working directory: $(pwd)${NC}"

# Check if docker.env exists
if [ ! -f "docker.env" ]; then
    echo -e "${RED}❌ docker.env file not found!${NC}"
    echo -e "${YELLOW}📝 Please copy docker.env.example to docker.env and update with your values${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Create network if it doesn't exist
echo -e "${BLUE}🔗 Creating Docker network...${NC}"
docker network create tambo_network 2>/dev/null || true

# Pull latest images (skip in CI where images are built locally)
if [ -z "$GITHUB_ACTIONS" ]; then
    echo -e "${YELLOW}📦 Pulling latest images...${NC}"
    docker compose --env-file docker.env pull --ignore-buildable
else
    echo -e "${YELLOW}📦 Skipping pull in CI (using locally built images)...${NC}"
fi

# Start all services with BuildKit
echo -e "${BLUE}🎯 Starting Tambo services with BuildKit...${NC}"
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose --env-file docker.env up -d

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Check if PostgreSQL is healthy
echo -e "${YELLOW}⏳ Checking PostgreSQL health...${NC}"
POSTGRES_RUNNING=$(docker compose --env-file docker.env ps -q postgres 2>/dev/null | wc -l)
if [ "$POSTGRES_RUNNING" -eq 0 ]; then
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to start...${NC}"
    sleep 20
fi

# Check if postgres container is healthy
POSTGRES_CONTAINER=$(docker compose --env-file docker.env ps -q postgres 2>/dev/null)
if [ -n "$POSTGRES_CONTAINER" ]; then
    POSTGRES_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$POSTGRES_CONTAINER" 2>/dev/null || echo "unknown")
    if [ "$POSTGRES_HEALTH" != "healthy" ]; then
        echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be healthy...${NC}"
        sleep 20
    fi
fi

# Check service status
echo -e "${GREEN}✅ Checking service status...${NC}"
docker compose --env-file docker.env ps

echo -e "${GREEN}🎉 Tambo Docker Stack started successfully!${NC}"
echo -e "${BLUE}📋 Available services:${NC}"
echo -e "  • Tambo Web: http://localhost:3210"
echo -e "  • Tambo API: http://localhost:3211"
echo -e "  • PostgreSQL Database: localhost:5433"
echo -e ""
echo -e "${YELLOW}💡 To stop the stack: ./scripts/cloud/tambo-stop.sh${NC}"
echo -e "${YELLOW}💡 To view logs: ./scripts/cloud/tambo-logs.sh${NC}" 
