#!/bin/bash

# Stop the Validation Agent

echo "🛑 Stopping AgendaIQ Validation Agent..."

if [ -f ".claude/validation-agent.pid" ]; then
    PID=$(cat .claude/validation-agent.pid)
    
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✅ Agent stopped (PID: $PID)"
        rm -f .claude/validation-agent.pid
    else
        echo "⚠️ Agent not running (stale PID file removed)"
        rm -f .claude/validation-agent.pid
    fi
else
    echo "⚠️ No agent PID file found"
fi

# Clean up any orphaned node processes
pkill -f "validation-agent.js" 2>/dev/null

echo "✅ Cleanup complete"