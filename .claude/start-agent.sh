#!/bin/bash

# Start the Validation Agent in background
# This agent continues running even if Claude session ends

echo "🚀 Starting AgendaIQ Validation Agent..."

# Check if already running
if [ -f ".claude/validation-agent.pid" ]; then
    PID=$(cat .claude/validation-agent.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "⚠️ Agent already running (PID: $PID)"
        echo "To stop: npm run agent:stop"
        exit 0
    fi
fi

# Start agent in background
nohup node .claude/validation-agent.js > .claude/agent.out 2>&1 &
AGENT_PID=$!

echo "✅ Validation Agent started (PID: $AGENT_PID)"
echo "📝 Logs: .claude/validation-agent.log"
echo "🔍 Status: .claude/validation-status.json"
echo ""
echo "Commands:"
echo "  npm run agent:status - Check agent status"
echo "  npm run agent:stop   - Stop the agent"
echo "  npm run agent:logs   - View agent logs"

# Wait a moment to check if it started successfully
sleep 2

if kill -0 $AGENT_PID 2>/dev/null; then
    echo "✅ Agent is running successfully"
else
    echo "❌ Agent failed to start. Check .claude/agent.out for errors"
    exit 1
fi