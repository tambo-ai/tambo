#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse command line arguments
DRY_RUN=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Running in dry-run mode - no changes will be made${NC}"
fi

confirm() {
    if [ "$DRY_RUN" = true ]; then
        true
        return
    fi
    read -r -p "${1:-Are you sure?} [y/N] " response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            true
            ;;
        *)
            false
            ;;
    esac
}

execute() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}Would execute: $1${NC}"
    else
        eval "$1"
    fi
}

install_node() {
    echo -e "${BLUE}Installing Node.js...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        execute "brew install node"
    else
        echo -e "${RED}Please install Node.js manually from https://nodejs.org${NC}"
        exit 1
    fi
}

install_supabase() {
    echo -e "${BLUE}Installing Supabase CLI...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        execute "brew install supabase/tap/supabase"
    else
        echo -e "${RED}Please install Supabase CLI manually from https://supabase.com/docs/guides/cli${NC}"
        exit 1
    fi
}

check_and_install_prerequisite() {
    local cmd=$1
    local install_func=$2
    
    if ! command -v $cmd >/dev/null 2>&1; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}Would install $cmd${NC}"
            return
        fi
        echo -e "${YELLOW}$cmd is not installed.${NC}"
        if confirm "Would you like to install $cmd?"; then
            $install_func
        else
            echo -e "${RED}$cmd is required but not installed. Aborting.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ $cmd is installed${NC}"
    fi
}

echo -e "${BLUE}Hydra AI Setup Script${NC}"
echo "This script will help you set up your Hydra AI development environment."
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}This is a dry run - showing what would happen without making changes${NC}"
fi
echo

# Step 1: Check prerequisites
echo -e "${GREEN}Step 1: Checking prerequisites${NC}"
if ! confirm "Do you want to check prerequisites?"; then
    echo "Skipping prerequisites check"
else
    check_and_install_prerequisite "node" install_node
    # npm comes with node, so just check if it exists
    check_and_install_prerequisite "npm" "echo 'npm should be installed with node'"
    check_and_install_prerequisite "supabase" install_supabase
fi
echo

# Step 2: Install dependencies
echo -e "${GREEN}Step 2: Installing dependencies${NC}"
if confirm "Do you want to install project dependencies?"; then
    execute "npm install"
fi
echo

# Step 3: Set up Supabase
echo -e "${GREEN}Step 3: Setting up Supabase${NC}"
if confirm "Do you want to start Supabase locally?"; then
    execute "supabase start"
fi
echo

# Step 4: Set up environment files
echo -e "${GREEN}Step 4: Setting up environment files${NC}"
if confirm "Do you want to set up environment files?"; then
    # API environment
    if [ ! -f "apps/api/.env" ]; then
        execute "cp apps/api/.env.example apps/api/.env"
        [ "$DRY_RUN" = false ] && echo "Created apps/api/.env"
    fi

    # Web environment
    if [ ! -f "apps/web/.env" ]; then
        execute "cp apps/web/.env.example apps/web/.env.local"
        [ "$DRY_RUN" = false ] && echo "Created apps/web/.env.local"
    fi

    # DB environment
    if [ ! -f "packages/db/.env" ]; then
        execute "cp packages/db/.env.example packages/db/.env"
        [ "$DRY_RUN" = false ] && echo "Created packages/db/.env"
    fi

    echo -e "\n${BLUE}Environment files that will be created if they don't exist:${NC}"
    echo "1. apps/api/.env"
    echo "2. apps/web/.env.local"
    echo "3. packages/db/.env"
    echo -e "\nRequired values to update:"
    echo "- EXTRACTION_OPENAI_API_KEY (get from magan)"
    echo "- OPENAI_API_KEY (get from magan)"
    echo "\n Not required, but recommended:"
    echo "- SLACK_* configurations (get from magan)"
    echo "- RESEND_API_KEY (get from magan)"
    echo "- POSTHOG_* configurations (get from magan)"
fi
echo

echo -e "${GREEN}Setup complete!${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}This was a dry run - no changes were made${NC}"
fi
echo "Next steps:"
echo "1. Update the environment files with your actual values"
echo "2. Run 'npm run dev' to start the development servers"

# Show usage if no arguments provided
if [ "$#" -eq 0 ]; then
    echo -e "\nUsage:"
    echo "  ./setup.sh [options]"
    echo "Options:"
    echo "  --dry-run    Show what would happen without making changes"
fi 