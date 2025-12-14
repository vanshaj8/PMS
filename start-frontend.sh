#!/bin/bash

# Start Frontend Script
# Usage: ./start-frontend.sh

echo "🚀 Starting PIP Management System - Frontend"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 18+ first"
    exit 1
fi

# Navigate to frontend directory
cd "$(dirname "$0")/frontend" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies for the first time..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Installation failed!"
        exit 1
    fi
fi

# Start the frontend
echo "✅ Starting frontend on http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

npm run dev

