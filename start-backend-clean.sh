#!/bin/bash

# Clean start script for backend
# This kills any existing processes and starts fresh

echo "🧹 Cleaning up existing processes..."
pkill -f "spring-boot:run" 2>/dev/null
pkill -f "PipManagementApplication" 2>/dev/null
sleep 2

# Check if port 8080 is free
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "⚠️  Port 8080 is still in use. Killing process..."
    kill -9 $(lsof -ti:8080) 2>/dev/null
    sleep 1
fi

echo "🚀 Starting backend..."
cd "$(dirname "$0")/backend-java" || exit 1

# Force Java 17 - Set JAVA_HOME and PATH to use Java 17
if [ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
    export PATH=$JAVA_HOME/bin:$PATH
elif [ -d "/opt/homebrew/Cellar/openjdk@17/17.0.17/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.17/libexec/openjdk.jdk/Contents/Home
    export PATH=$JAVA_HOME/bin:$PATH
elif [ -d "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
    export PATH=$JAVA_HOME/bin:$PATH
fi

echo "✅ Using Java: $(java -version 2>&1 | head -1)"
echo "✅ Starting backend on http://localhost:8080"
echo "Press Ctrl+C to stop"
echo ""

mvn spring-boot:run
