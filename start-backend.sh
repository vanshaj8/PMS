#!/bin/bash

# Start Java Backend Script
# Usage: ./start-backend.sh

echo "🚀 Starting PIP Management System - Java Backend"
echo "================================================"

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed!"
    echo "Please install Java 17+ first:"
    echo "  brew install openjdk@17"
    exit 1
fi

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "❌ Java version must be 17 or higher!"
    echo "Current version: $(java -version 2>&1 | head -1)"
    echo "Please install Java 17+: brew install openjdk@17"
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed!"
    echo "Please install Maven first:"
    echo "  brew install maven"
    exit 1
fi

# Force Java 17 - Set JAVA_HOME and PATH to use Java 17
if [ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
    export PATH=$JAVA_HOME/bin:$PATH
    echo "✅ Using Java 17 from: $JAVA_HOME"
elif [ -d "/opt/homebrew/Cellar/openjdk@17/17.0.17/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.17/libexec/openjdk.jdk/Contents/Home
    export PATH=$JAVA_HOME/bin:$PATH
    echo "✅ Using Java 17 from: $JAVA_HOME"
elif [ -d "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
    export PATH=$JAVA_HOME/bin:$PATH
    echo "✅ Using Java 17 from: $JAVA_HOME"
else
    echo "⚠️  Java 17 not found in standard locations. Using system Java."
    echo "   Current Java: $(java -version 2>&1 | head -1)"
fi

# Navigate to backend directory
cd "$(dirname "$0")/backend-java" || exit 1

# Check if project is built
if [ ! -f "target/pip-management-backend-1.0.0.jar" ]; then
    echo "📦 Building project for the first time..."
    mvn clean install -DskipTests
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
fi

# Start the backend
echo "✅ Starting backend on http://localhost:8080"
echo "Press Ctrl+C to stop"
echo ""

mvn spring-boot:run

