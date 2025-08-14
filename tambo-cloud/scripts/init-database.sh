#!/usr/bin/env sh

# Initialize Tambo Database
# This script initializes the PostgreSQL database with the required schema.
# It can run either on the host (using Docker to connect to Postgres)
# or inside a running Docker container (e.g., the API container).

set -e

# Colors for output (use literal escape bytes so they work without -e)
RED="$(printf '\033[0;31m')"
GREEN="$(printf '\033[0;32m')"
YELLOW="$(printf '\033[1;33m')"
BLUE="$(printf '\033[0;34m')"
NC="$(printf '\033[0m')" # No Color

# Determine script directory (POSIX-compatible)
case "$0" in
  /*) SCRIPT_PATH="$0" ;;
  *) SCRIPT_PATH="$(pwd)/$0" ;;
esac
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root directory
cd "$PROJECT_ROOT"

printf "%s\n" "${GREEN}🗄️  Initializing Tambo Database...${NC}"
printf "%s\n" "${BLUE}📁 Working directory: $(pwd)${NC}"

# Detect if running inside a Docker container
IS_IN_DOCKER=false
if [ -f "/.dockerenv" ] || grep -qa docker /proc/1/cgroup 2>/dev/null; then
  IS_IN_DOCKER=true
fi

# When running on the host, this script will delegate to the api container.
# When running inside a container, it will run the migrations directly.

if [ "$IS_IN_DOCKER" = false ]; then
  # Host mode: delegate to Docker container
  if [ ! -f "docker.env" ]; then
    printf "%s\n" "${RED}❌ docker.env file not found!${NC}"
    printf "%s\n" "${YELLOW}📝 Please copy docker.env.example to docker.env and update with your values${NC}"
    exit 1
  fi
  if ! command -v docker >/dev/null 2>&1; then
    printf "%s\n" "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    printf "%s\n" "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
  fi
  if ! command -v docker compose >/dev/null 2>&1; then
    printf "%s\n" "${RED}❌ Docker Compose is not available. Please install Docker Compose.${NC}"
    exit 1
  fi
  if ! docker compose --env-file docker.env ps api | grep -q "Up"; then
    printf "%s\n" "${RED}❌ API container is not running. Please start the stack first:${NC}"
    printf "%s\n" "${YELLOW}   ./scripts/tambo-start.sh${NC}"
    exit 1
  fi

  printf "%s\n" "${BLUE}📦 Delegating to api container...${NC}"
  exec docker compose --env-file docker.env exec -T api sh -lc "./scripts/init-database.sh"
fi

# From here on, we are inside a container

# Host-only: check if npm is available (not needed in-container if image already has Node)
if [ "$IS_IN_DOCKER" = false ]; then
  if ! command -v npm >/dev/null 2>&1; then
    printf "%s\n" "${RED}❌ npm is not available. Please install Node.js and npm first.${NC}"
    exit 1
  fi
fi

# In-container: assume service orchestration handled readiness

# Run database migrations
printf "%s\n" "${BLUE}🔄 Running database migrations...${NC}"

# In-container mode: rely on DATABASE_URL already present in environment
if [ -z "$DATABASE_URL" ]; then
  printf "%s\n" "${RED}❌ DATABASE_URL is not set in the container environment.${NC}"
  printf "%s\n" "${YELLOW}   Please ensure your service sets DATABASE_URL, or run this script from the host to auto-delegate into the container.${NC}"
  exit 1
fi
printf "%s\n" "${BLUE}📋 Using container DATABASE_URL: $DATABASE_URL${NC}"
printf "%s\n" "${BLUE}📊 Running database migrations inside container...${NC}"
npm run db:migrate

printf "%s\n" "${GREEN}✅ Database initialization completed successfully!${NC}"
printf "%s\n" "${BLUE}📋 Database is now ready for use.${NC}"
