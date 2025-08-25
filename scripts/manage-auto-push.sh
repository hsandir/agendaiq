#!/bin/bash

# Auto-push management script
# This script helps manage the automatic push to GitHub feature

CONFIG_FILE=".git/hooks/auto-push-config"
HOOK_FILE=".git/hooks/post-commit"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo -e "${BLUE}Auto-push Management Script${NC}"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  enable     - Enable auto-push feature"
    echo "  disable    - Disable auto-push feature"
    echo "  status     - Show current auto-push status"
    echo "  config     - Show current configuration"
    echo "  test       - Test the auto-push hook"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 enable"
    echo "  $0 disable"
    echo "  $0 status"
    echo "  $0 config"
}

# Function to check if hook exists
check_hook() {
    if [ ! -f "$HOOK_FILE" ]; then
        echo -e "${RED}❌ Post-commit hook not found!${NC}"
        echo "Please ensure the hook is properly installed."
        return 1
    fi
    
    if [ ! -x "$HOOK_FILE" ]; then
        echo -e "${YELLOW}⚠️  Post-commit hook is not executable${NC}"
        echo "Making it executable..."
        chmod +x "$HOOK_FILE"
    fi
    
    return 0
}

# Function to enable auto-push
enable_auto_push() {
    echo -e "${BLUE}Enabling auto-push...${NC}"
    
    if ! check_hook; then
        return 1
    fi
    
    # Create or update config file
    cat > "$CONFIG_FILE" << EOF
# Auto-push configuration
# Set to 1 to enable auto-push, 0 to disable
AUTO_PUSH_ENABLED=1

# Remote name to push to (usually 'origin')
REMOTE_NAME=origin

# Whether to show push output (1 for verbose, 0 for quiet)
VERBOSE_OUTPUT=1

# Whether to push all branches or just current branch
# Options: "current" or "all"
PUSH_MODE="current"
EOF
    
    echo -e "${GREEN}✅ Auto-push enabled!${NC}"
    echo "Configuration saved to: $CONFIG_FILE"
}

# Function to disable auto-push
disable_auto_push() {
    echo -e "${BLUE}Disabling auto-push...${NC}"
    
    if [ -f "$CONFIG_FILE" ]; then
        # Update config to disable
        sed -i '' 's/AUTO_PUSH_ENABLED=1/AUTO_PUSH_ENABLED=0/' "$CONFIG_FILE"
        echo -e "${GREEN}✅ Auto-push disabled!${NC}"
    else
        echo -e "${YELLOW}⚠️  No configuration file found${NC}"
        echo "Creating disabled configuration..."
        enable_auto_push
        disable_auto_push
    fi
}

# Function to show status
show_status() {
    echo -e "${BLUE}Auto-push Status:${NC}"
    echo ""
    
    # Check if hook exists
    if [ -f "$HOOK_FILE" ]; then
        echo -e "${GREEN}✅ Post-commit hook: Installed${NC}"
        
        if [ -x "$HOOK_FILE" ]; then
            echo -e "${GREEN}✅ Post-commit hook: Executable${NC}"
        else
            echo -e "${RED}❌ Post-commit hook: Not executable${NC}"
        fi
    else
        echo -e "${RED}❌ Post-commit hook: Not found${NC}"
    fi
    
    # Check configuration
    if [ -f "$CONFIG_FILE" ]; then
        echo -e "${GREEN}✅ Configuration file: Found${NC}"
        source "$CONFIG_FILE"
        
        if [ "$AUTO_PUSH_ENABLED" = "1" ]; then
            echo -e "${GREEN}✅ Auto-push: Enabled${NC}"
        else
            echo -e "${YELLOW}⏸️  Auto-push: Disabled${NC}"
        fi
        
        echo "   Remote: $REMOTE_NAME"
        echo "   Verbose: $VERBOSE_OUTPUT"
        echo "   Push mode: $PUSH_MODE"
    else
        echo -e "${YELLOW}⚠️  Configuration file: Not found${NC}"
    fi
    
    # Check remote
    if git remote get-url origin >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Git remote 'origin': Configured${NC}"
        echo "   URL: $(git remote get-url origin)"
    else
        echo -e "${RED}❌ Git remote 'origin': Not configured${NC}"
    fi
}

# Function to show configuration
show_config() {
    if [ -f "$CONFIG_FILE" ]; then
        echo -e "${BLUE}Current Configuration:${NC}"
        echo ""
        cat "$CONFIG_FILE"
    else
        echo -e "${YELLOW}No configuration file found${NC}"
    fi
}

# Function to test the hook
test_hook() {
    echo -e "${BLUE}Testing auto-push hook...${NC}"
    
    if ! check_hook; then
        return 1
    fi
    
    # Create a temporary test file
    TEST_FILE="test-auto-push-$(date +%s).txt"
    echo "Test commit for auto-push hook" > "$TEST_FILE"
    
    # Add and commit the test file
    git add "$TEST_FILE"
    git commit -m "Test: Auto-push hook functionality" --no-verify
    
    # Clean up test file
    rm "$TEST_FILE"
    git add "$TEST_FILE"
    git commit -m "Remove test file" --no-verify
    
    echo -e "${GREEN}✅ Test completed!${NC}"
    echo "Check the output above to see if auto-push worked."
}

# Main script logic
case "${1:-help}" in
    "enable")
        enable_auto_push
        ;;
    "disable")
        disable_auto_push
        ;;
    "status")
        show_status
        ;;
    "config")
        show_config
        ;;
    "test")
        test_hook
        ;;
    "help"|*)
        show_usage
        ;;
esac 