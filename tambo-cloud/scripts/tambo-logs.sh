#!/bin/bash

# View Tambo Docker Stack Logs
# This script displays logs from the Tambo application and PostgreSQL database

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

# Check if docker.env exists
if [ ! -f "docker.env" ]; then
    echo -e "${RED}❌ docker.env file not found!${NC}"
    echo -e "${YELLOW}📝 Please copy docker.env.example to docker.env and update with your values${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Tambo Docker Stack Logs${NC}"
echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
echo -e ""

# Function to show usage
show_usage() {
    echo -e "${YELLOW}Usage: $0 [service_name]${NC}"
    echo -e "${YELLOW}Available services:${NC}"
    echo -e "  • web - Tambo Web application"
    echo -e "  • api - Tambo API application"
    echo -e "  • postgres - PostgreSQL Database"
    echo -e ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0           # Show all logs"
    echo -e "  $0 web       # Show only web logs"
    echo -e "  $0 api       # Show only api logs"
    echo -e "  $0 postgres  # Show only postgres logs"
}

# Check if help requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

# If service name provided, show logs for that service only
if [ -n "$1" ]; then
    SERVICE_NAME="$1"
    echo -e "${GREEN}📋 Showing logs for: $SERVICE_NAME${NC}"
    docker compose --env-file docker.env logs -f "$SERVICE_NAME"
else
    # Show all logs
    echo -e "${GREEN}📋 Showing all logs${NC}"
    docker compose --env-file docker.env logs -f
fi 