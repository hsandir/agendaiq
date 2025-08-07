# Auto-Push to GitHub Feature

This project includes an automatic push feature that pushes your commits to GitHub immediately after you make them.

## 🚀 How It Works

When you make a commit using `git commit`, the post-commit hook automatically runs and pushes your changes to the `origin` remote (GitHub).

## 📋 Prerequisites

- Git repository with a remote origin configured
- GitHub credentials set up (SSH key or personal access token)
- The post-commit hook must be executable

## 🛠️ Management Commands

Use the management script to control the auto-push feature:

```bash
# Check current status
./scripts/manage-auto-push.sh status

# Enable auto-push
./scripts/manage-auto-push.sh enable

# Disable auto-push
./scripts/manage-auto-push.sh disable

# Show configuration
./scripts/manage-auto-push.sh config

# Test the auto-push feature
./scripts/manage-auto-push.sh test

# Show help
./scripts/manage-auto-push.sh help
```

## ⚙️ Configuration

The auto-push feature is configured via `.git/hooks/auto-push-config`:

```bash
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
```

## 🔧 Manual Configuration

### Enable Auto-Push
```bash
# Edit the configuration file
nano .git/hooks/auto-push-config

# Set AUTO_PUSH_ENABLED=1
```

### Disable Auto-Push
```bash
# Edit the configuration file
nano .git/hooks/auto-push-config

# Set AUTO_PUSH_ENABLED=0
```

### Push All Branches
```bash
# Edit the configuration file
nano .git/hooks/auto-push-config

# Set PUSH_MODE="all"
```

## 🚨 Troubleshooting

### Auto-push fails
1. Check your internet connection
2. Verify your GitHub credentials
3. Ensure the remote origin is configured correctly
4. Check if you have permission to push to the repository

### Hook not working
1. Ensure the hook is executable: `chmod +x .git/hooks/post-commit`
2. Check if the hook file exists: `ls -la .git/hooks/post-commit`
3. Verify the configuration file exists: `ls -la .git/hooks/auto-push-config`

### Skip auto-push for a specific commit
```bash
# Use --no-verify flag to skip hooks
git commit -m "Your message" --no-verify
```

## 📝 Example Output

When auto-push is working correctly, you'll see output like this:

```
🔄 Auto-pushing to GitHub...
📍 Pushing branch 'main' to origin
✅ Successfully pushed to GitHub!
🌐 Remote: origin
```

## 🔒 Security Notes

- The auto-push feature only pushes to the configured remote
- It respects your existing Git credentials and authentication
- You can disable it at any time using the management script
- Failed pushes will show error messages to help you troubleshoot

## 📚 Related Files

- `.git/hooks/post-commit` - The main hook script
- `.git/hooks/auto-push-config` - Configuration file
- `scripts/manage-auto-push.sh` - Management script
- `AUTO_PUSH_README.md` - This documentation file 