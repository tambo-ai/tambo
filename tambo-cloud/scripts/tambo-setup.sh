#!/bin/bash

# Setup Tambo Docker Environment
# This script helps set up the Tambo Docker environment for the first time

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root directory
cd "$PROJECT_ROOT"

echo -e "${GREEN}🚀 Tambo Docker Setup${NC}"
echo -e "${BLUE}This script will help you set up Tambo for self-hosting with Docker${NC}"
echo -e "${BLUE}📁 Working directory: $(pwd)${NC}"
echo -e ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo -e "${YELLOW}💡 Visit: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo -e "${YELLOW}💡 Visit: https://docs.docker.com/compose/install/${NC}"
    exit 1
fi

# Check if jq is installed (needed for health checks)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is not installed. Installing jq...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y jq
    elif command -v yum &> /dev/null; then
        sudo yum install -y jq
    elif command -v brew &> /dev/null; then
        brew install jq
    else
        echo -e "${RED}❌ Could not install jq. Please install it manually.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Prerequisites check passed!${NC}"
echo -e ""

# Create docker.env from example if it doesn't exist
if [ ! -f "docker.env" ]; then
    echo -e "${YELLOW}📝 Creating docker.env from example...${NC}"
    if [ -f "docker.env.example" ]; then
        cp docker.env.example docker.env
        echo -e "${GREEN}✅ docker.env created successfully!${NC}"
    else
        echo -e "${RED}❌ docker.env.example not found!${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}ℹ️  docker.env already exists${NC}"
fi

# Make scripts executable
echo -e "${YELLOW}🔧 Making scripts executable...${NC}"
chmod +x scripts/tambo-*.sh
chmod +x scripts/init-database.sh

echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo -e ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "1. ${YELLOW}Edit docker.env${NC} with your actual values:"
echo -e "   - Update passwords and secrets"
echo -e "   - Add your API keys (OpenAI, etc.)"
echo -e "   - Configure other settings as needed"
echo -e ""
echo -e "2. ${YELLOW}Build the containers:${NC}"
echo -e "   ./scripts/tambo-build.sh"
echo -e ""
echo -e "3. ${YELLOW}Start the stack:${NC}"
echo -e "   ./scripts/tambo-start.sh"
echo -e ""
echo -e "4. ${YELLOW}Initialize the database:${NC}"
echo -e "   ./scripts/init-database.sh"
echo -e ""
echo -e "5. ${YELLOW}Access your applications:${NC}"
echo -e "   - Tambo Web: http://localhost:3210"
echo -e "   - Tambo API: http://localhost:3211"
echo -e "   - PostgreSQL Database: localhost:5433"
echo -e ""
echo -e "${YELLOW}💡 For help, run: ./scripts/tambo-logs.sh --help${NC}" 