#!/bin/bash

# PIP Workflow Automation Runner
# Convenience script to run the automation with proper setup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 PIP Workflow Automation"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version must be 14 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if backend is running
API_URL="${API_BASE_URL:-http://localhost:8080}"
echo "🔍 Checking backend connection..."
if curl -s -f "$API_URL/api/health" > /dev/null 2>&1; then
    echo "✅ Backend is running at $API_URL"
else
    echo "⚠️  Warning: Backend may not be running at $API_URL"
    echo "   The script will continue but may fail if backend is not accessible."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "▶️  Starting automation..."
echo ""

# Run the automation script
node automate-pip-workflow.js

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Automation completed successfully!"
else
    echo ""
    echo "❌ Automation failed with exit code $EXIT_CODE"
fi

exit $EXIT_CODE

