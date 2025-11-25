#!/bin/bash
# Check if file is a config file that requires user approval
# Only outputs a message if it's a protected config file

# Read JSON input from stdin
input=$(cat)

# Extract file path from tool_input.file_path
file=$(echo "$input" | node -e "
  const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
  console.log(data.tool_input?.file_path || '');
")

# Get just the filename
filename=$(basename "$file")

# Check if it's a config file that requires approval
if [[ "$filename" =~ ^\.eslintrc|^eslint\.config\.|^tsconfig.*\.json$ ]]; then
  echo "STOP: You are about to modify '$filename' which is a linting/TypeScript config file."
  echo "Per AGENTS.md rules, you MUST ask the user for explicit approval before proceeding."
  echo "Ask: 'This modifies a config file. Do you approve this change?'"
  echo "Do NOT proceed without user confirmation."
fi
