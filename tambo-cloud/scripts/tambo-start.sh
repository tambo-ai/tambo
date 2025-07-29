#!/bin/bash

# Start Tambo Docker Stack
# This script starts the Tambo application with PostgreSQL database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Tambo Docker Stack...${NC}"

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

# Pull latest images
echo -e "${YELLOW}📦 Pulling latest images...${NC}"
docker compose --env-file docker.env pull

# Start all services
echo -e "${BLUE}🎯 Starting Tambo services...${NC}"
docker compose --env-file docker.env up -d

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Check if PostgreSQL is healthy
POSTGRES_HEALTH=$(docker compose --env-file docker.env ps --format json | jq -r '.[] | select(.Service == "postgres") | .Health')
if [ "$POSTGRES_HEALTH" != "healthy" ]; then
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be healthy...${NC}"
    sleep 20
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
echo -e "${YELLOW}💡 To stop the stack: ./scripts/tambo-stop.sh${NC}"
echo -e "${YELLOW}💡 To view logs: ./scripts/tambo-logs.sh${NC}" 