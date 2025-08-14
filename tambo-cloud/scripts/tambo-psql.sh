#!/bin/bash

# Connect to Tambo PostgreSQL Database
# This script connects to the PostgreSQL database running in Docker

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root directory
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  Connecting to Tambo PostgreSQL Database...${NC}"
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

# Check if PostgreSQL container is running
if ! docker compose --env-file docker.env ps postgres | grep -q "Up"; then
    echo -e "${RED}❌ PostgreSQL container is not running. Please start the stack first:${NC}"
    echo -e "${YELLOW}   ./scripts/tambo-start.sh${NC}"
    exit 1
fi

# Get database credentials from the running container
echo -e "${BLUE}📋 Getting database credentials from running container...${NC}"
POSTGRES_PASSWORD=$(docker compose --env-file docker.env exec -T postgres printenv POSTGRES_PASSWORD 2>/dev/null || echo "your-super-secret-and-long-postgres-password")
POSTGRES_USER=$(docker compose --env-file docker.env exec -T postgres printenv POSTGRES_USER 2>/dev/null || echo "postgres")
POSTGRES_DB=$(docker compose --env-file docker.env exec -T postgres printenv POSTGRES_DB 2>/dev/null || echo "tambo")

echo -e "${GREEN}✅ Connecting to PostgreSQL...${NC}"
echo -e "${BLUE}📋 Database: $POSTGRES_DB${NC}"
echo -e "${BLUE}📋 User: $POSTGRES_USER${NC}"
echo -e "${BLUE}📋 Host: localhost:5433${NC}"
echo -e ""

# Connect to PostgreSQL using psql in the postgres container (no host psql required)
docker compose --env-file docker.env exec -e PGPASSWORD="$POSTGRES_PASSWORD" -T postgres psql -h localhost -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"