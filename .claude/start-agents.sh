#!/bin/bash

# Start Agents with Memory Limits
# Memory limits: 256MB for validation agent, 512MB for ESLint fix agent

echo "Starting agents with memory limits..."

# Kill any existing agents
pkill -f "validation-agent.js" 2>/dev/null
pkill -f "eslint-fix-agent.js" 2>/dev/null

# Wait a moment
sleep 1

# Start validation agent with 256MB memory limit
echo "Starting validation agent (256MB memory limit)..."
node --max-old-space-size=256 .claude/validation-agent.js > .claude/validation-agent.log 2>&1 &
echo "Validation agent PID: $!"

# Start ESLint fix agent with 512MB memory limit and watch mode
echo "Starting ESLint fix agent (512MB memory limit)..."
node --max-old-space-size=512 .claude/eslint-fix-agent.js --watch > .claude/eslint-fix-agent.log 2>&1 &
echo "ESLint fix agent PID: $!"

echo ""
echo "Agents started with memory limits:"
echo "- Validation agent: 256MB max memory"
echo "- ESLint fix agent: 512MB max memory"
echo ""
echo "Logs available at:"
echo "- .claude/validation-agent.log"
echo "- .claude/eslint-fix-agent.log"
echo ""
echo "To stop agents: pkill -f 'validation-agent.js|eslint-fix-agent.js'"