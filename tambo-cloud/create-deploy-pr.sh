#!/bin/bash

# Exit on error
set -e

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated with gh
if ! gh auth status &> /dev/null; then
    echo "Please login to GitHub CLI first using: gh auth login"
    exit 1
fi

# Get current branch
current_branch=$(git branch --show-current)

# If not on main, confirm switch
if [ "$current_branch" != "main" ]; then
    read -p "You're not on main branch. Switch to main? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
    else
        echo "Aborting deployment"
        exit 1
    fi
fi

# Pull latest main
git pull origin main

# Get the changes between deploy and main
echo "Changes from deploy -> main:"
echo "----------------------------"
git log deploy..main --pretty=format:"%h %s [%an] (%ad) %b" --date=short | while read -r line; do
    # Extract PR number if it exists in the commit message
    pr_num=$(echo "$line" | grep -o '#[0-9]\+' | tr -d '#')
    if [ ! -z "$pr_num" ]; then
        # Get the PR URL
        pr_url="$(gh pr view "$pr_num" --json url -q .url 2>/dev/null || echo "PR not found")"
        echo "$line - $pr_url"
    else
        echo "$line"
    fi
done
echo "----------------------------"

# Create new deploy branch with timestamp
timestamp=$(date +%Y-%m-%dT%H-%M-%S)
deploy_branch="deploy-$timestamp"
git checkout -b "$deploy_branch"

# Push to remote
git push origin "$deploy_branch"

# Create PR
pr_url=$(gh pr create \
    --base deploy \
    --head "$deploy_branch" \
    --title "Deploy to production $(date +%Y-%m-%d)" \
    --body "Deploying changes from main to production.

Changes included in this deployment:
$(git log deploy..main --pretty=format:"* %h %s [%an] (%ad)" --date=short)" \
    --no-maintainer-edit)

echo
echo "Deployment PR created: $pr_url"
echo
echo "To merge this PR into deploy, run:"
echo "gh pr merge $pr_url --merge --delete-branch"