#!/bin/bash

# Tambo Release Detection Script
# Detects if the latest git tag is a relevant Tambo release (react-sdk-v* or cli-v*)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get the latest release tag
get_latest_release_tag() {
    local latest_tag
    
    # Try multiple methods to get the latest tag
    if latest_tag=$(git describe --tags --abbrev=0 2>/dev/null); then
        echo "$latest_tag"
        return 0
    fi
    
    # Fallback: get the most recent tag from git tag list
    if latest_tag=$(git tag --sort=-version:refname | head -n1 2>/dev/null); then
        if [ -n "$latest_tag" ]; then
            echo "$latest_tag"
            return 0
        fi
    fi
    
    # No tags found
    return 1
}

# Function to validate tag format
validate_tag_format() {
    local tag="$1"
    
    # Check for react-sdk release pattern
    if [[ "$tag" =~ ^react-sdk-v([0-9]+)\.([0-9]+)\.([0-9]+)(-.*)?$ ]]; then
        echo "react-sdk"
        return 0
    fi
    
    # Check for cli release pattern
    if [[ "$tag" =~ ^cli-v([0-9]+)\.([0-9]+)\.([0-9]+)(-.*)?$ ]]; then
        echo "cli"
        return 0
    fi
    
    # Not a relevant release
    return 1
}

# Function to extract version from tag
extract_version() {
    local tag="$1"
    local type="$2"
    
    if [ "$type" = "react-sdk" ]; then
        echo "$tag" | sed 's/^react-sdk-v//'
    elif [ "$type" = "cli" ]; then
        echo "$tag" | sed 's/^cli-v//'
    fi
}

# Function to check if this is a new release (not processed before)
check_if_new_release() {
    local tag="$1"
    local processed_file=".github/.processed-releases"
    
    if [ -f "$processed_file" ] && grep -q "^$tag$" "$processed_file"; then
        return 1  # Already processed
    fi
    
    return 0  # New release
}

# Function to mark release as processed
mark_release_processed() {
    local tag="$1"
    local processed_file=".github/.processed-releases"
    
    mkdir -p "$(dirname "$processed_file")"
    echo "$tag" >> "$processed_file"
    
    # Keep only the last 50 entries to prevent file from growing too large
    if [ -f "$processed_file" ]; then
        tail -n 50 "$processed_file" > "${processed_file}.tmp"
        mv "${processed_file}.tmp" "$processed_file"
    fi
}

# Main execution
main() {
    log_info "Starting Tambo release detection..."
    
    # Get the latest tag
    if ! latest_tag=$(get_latest_release_tag); then
        log_warn "No git tags found in repository"
        echo "should-upgrade=false" >> "$GITHUB_OUTPUT"
        exit 0
    fi
    
    log_info "Latest tag found: $latest_tag"
    
    # Validate tag format and get type
    if release_type=$(validate_tag_format "$latest_tag"); then
        log_info "Valid Tambo release detected: $latest_tag (type: $release_type)"
        
        # Check if this is a new release
        if check_if_new_release "$latest_tag"; then
            log_info "This is a new release that hasn't been processed yet"
            
            # Extract version
            version=$(extract_version "$latest_tag" "$release_type")
            
            # Generate release URL
            release_url="https://github.com/${GITHUB_REPOSITORY}/releases/tag/${latest_tag}"
            
            # Set outputs
            echo "should-upgrade=true" >> "$GITHUB_OUTPUT"
            echo "release-tag=$latest_tag" >> "$GITHUB_OUTPUT"
            echo "release-type=$release_type" >> "$GITHUB_OUTPUT"
            echo "release-version=$version" >> "$GITHUB_OUTPUT"
            echo "release-url=$release_url" >> "$GITHUB_OUTPUT"
            
            # Mark as processed
            mark_release_processed "$latest_tag"
            
            log_info "Release detection completed successfully"
            log_info "  Tag: $latest_tag"
            log_info "  Type: $release_type"
            log_info "  Version: $version"
            log_info "  URL: $release_url"
        else
            log_info "Release $latest_tag has already been processed, skipping"
            echo "should-upgrade=false" >> "$GITHUB_OUTPUT"
        fi
    else
        log_info "Tag $latest_tag is not a relevant Tambo release (not react-sdk-v* or cli-v*)"
        echo "should-upgrade=false" >> "$GITHUB_OUTPUT"
    fi
}

# Run main function
main "$@"