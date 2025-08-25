#!/bin/bash
# SAFE FILE OPERATIONS SCRIPT - ALWAYS USE THIS!

# Create trash directory if not exists
TRASH_DIR="$HOME/.trash/agendaiq/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TRASH_DIR"

# Function to safely delete files
safe_delete() {
    local file="$1"
    if [ -e "$file" ]; then
        echo "Moving $file to trash: $TRASH_DIR"
        cp -r "$file" "$TRASH_DIR/" 2>/dev/null
        echo "Backup created at: $TRASH_DIR/$(basename $file)"
    else
        echo "File not found: $file"
    fi
}

# Function to safely move files
safe_move() {
    local source="$1"
    local dest="$2"
    if [ -e "$source" ]; then
        echo "Creating backup before move: $source"
        cp -r "$source" "$TRASH_DIR/" 2>/dev/null
        mv "$source" "$dest"
        echo "Moved: $source -> $dest (backup at $TRASH_DIR)"
    else
        echo "Source not found: $source"
    fi
}

# Parse commands
case "$1" in
    delete|rm)
        shift
        for file in "$@"; do
            safe_delete "$file"
        done
        ;;
    move|mv)
        safe_move "$2" "$3"
        ;;
    *)
        echo "Usage: $0 {delete|rm|move|mv} <files>"
        exit 1
        ;;
esac