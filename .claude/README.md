# Claude Session Management

This directory contains Claude AI session persistence files for the AgendaIQ project.

## Files

- `session.json` - Current session state and active tasks
- `history.md` - Session history and completed work log
- `README.md` - This file

## Purpose

These files enable Claude to maintain context across sessions, eliminating the need to ask "where did we leave off?" when resuming work.

## Usage

When starting a new Claude session in the AgendaIQ directory:
1. Claude automatically reads the session state
2. Work continues from the last saved point
3. No manual context setup required

## Auto-Updated

These files are automatically maintained by Claude during work sessions.