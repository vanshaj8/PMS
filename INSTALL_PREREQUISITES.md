# Installing Prerequisites

## Current Status
✅ **Node.js:** v22.15.0 (Installed)  
✅ **npm:** v10.9.2 (Installed)  
❌ **Java:** Not installed  
❌ **Maven:** Not installed  

---

## Install Java 17 (Required for Backend)

### macOS (Using Homebrew - Recommended)

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Java 17
brew install openjdk@17

# Set Java 17 as default (correct path)
if [ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
    export PATH=$JAVA_HOME/bin:$PATH
    echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"' >> ~/.zshrc
    echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.zshrc
fi
source ~/.zshrc

# Verify installation
java -version
```

**Expected output:**
```
openjdk version "17.0.x"
OpenJDK Runtime Environment (build 17.0.x)
OpenJDK 64-Bit Server VM (build 17.0.x, mixed mode, sharing)
```

### macOS (Manual Installation)

1. Download from: https://adoptium.net/temurin/releases/?version=17
2. Choose macOS → x64 → .pkg installer
3. Install the package
4. Verify: `java -version`

### Alternative: Use SDKMAN (Easier Management)

```bash
# Install SDKMAN
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Install Java 17
sdk install java 17.0.9-tem

# Set as default
sdk default java 17.0.9-tem

# Verify
java -version
```

---

## Install Maven (Required for Building Java Backend)

### macOS (Using Homebrew - Recommended)

```bash
brew install maven

# Verify installation
mvn -version
```

**Expected output:**
```
Apache Maven 3.9.x
Maven home: /opt/homebrew/Cellar/maven/3.9.x/libexec
Java version: 17.0.x
```

### macOS (Manual Installation)

1. Download from: https://maven.apache.org/download.cgi
2. Extract to `/opt/maven` or `~/maven`
3. Add to PATH:
   ```bash
   echo 'export PATH="/opt/maven/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```
4. Verify: `mvn -version`

---

## Quick Install Script (macOS)

Run this script to install everything:

```bash
# Install Java 17
brew install openjdk@17
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@17"' >> ~/.zshrc

# Install Maven
brew install maven

# Reload shell configuration
source ~/.zshrc

# Verify installations
echo "=== Java ==="
java -version
echo "\n=== Maven ==="
mvn -version
echo "\n=== Node.js ==="
node -v
npm -v
```

---

## After Installation

Once Java and Maven are installed, proceed with the setup:

1. **Install Frontend Dependencies:**
   ```bash
   cd /Users/vanshajsharma/PIP/frontend
   npm install
   ```

2. **Build Java Backend:**
   ```bash
   cd /Users/vanshajsharma/PIP/backend-java
   mvn clean install
   ```

3. **Start Backend:**
   ```bash
   cd /Users/vanshajsharma/PIP/backend-java
   mvn spring-boot:run
   ```

4. **Start Frontend (in new terminal):**
   ```bash
   cd /Users/vanshajsharma/PIP/frontend
   npm run dev
   ```

---

## Troubleshooting Installation

### Java Installation Issues

**Issue: "java: command not found"**
- Make sure PATH includes Java bin directory
- Restart terminal after adding to PATH
- Verify: `which java`

**Issue: Wrong Java Version**
- Check: `java -version`
- If it shows Java 8 or 11, you need Java 17+
- Use `brew install openjdk@17` to install correct version

### Maven Installation Issues

**Issue: "mvn: command not found"**
- Verify Maven is in PATH: `which mvn`
- Restart terminal after installation
- Try: `brew install maven` again

**Issue: Maven can't find Java**
- Set JAVA_HOME environment variable
- Add to ~/.zshrc:
  ```bash
  export JAVA_HOME=$(/usr/libexec/java_home -v 17)
  export PATH=$JAVA_HOME/bin:$PATH
  ```

---

## Verify All Prerequisites

Run this command to check everything:

```bash
echo "=== Checking Prerequisites ==="
echo "Java:"
java -version 2>&1 | head -1 || echo "❌ Java not found"
echo "\nMaven:"
mvn -version 2>&1 | head -1 || echo "❌ Maven not found"
echo "\nNode.js:"
node -v || echo "❌ Node.js not found"
echo "\nnpm:"
npm -v || echo "❌ npm not found"
```

All should show version numbers (not errors) before proceeding.

