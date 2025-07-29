#!/bin/bash

# Initialize Tambo Database
# This script initializes the PostgreSQL database with the required schema

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  Initializing Tambo Database...${NC}"

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

# Check if PostgreSQL container is running
if ! docker compose --env-file docker.env ps postgres | grep -q "Up"; then
    echo -e "${RED}❌ PostgreSQL container is not running. Please start the stack first:${NC}"
    echo -e "${YELLOW}   ./scripts/tambo-start.sh${NC}"
    exit 1
fi

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
until docker compose --env-file docker.env exec -T postgres pg_isready -U postgres; do
    sleep 2
done

echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"

# Check if drizzle-kit is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx is not available. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Run database migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
cd ..

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not available. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Run the database migrations using the npm script
echo -e "${BLUE}📊 Running database migrations...${NC}"
npm run db:migrate

echo -e "${GREEN}✅ Database initialization completed successfully!${NC}"
echo -e "${BLUE}📋 Database is now ready for use.${NC}" 