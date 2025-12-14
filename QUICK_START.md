# 🚀 Quick Start Guide

## Prerequisites Installation (First Time Only)

### Step 1: Install Java 17 and Maven

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Java 17
brew install openjdk@17

# Add Java to PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@17"' >> ~/.zshrc
source ~/.zshrc

# Install Maven
brew install maven

# Verify installations
java -version  # Should show Java 17+
mvn -version   # Should show Maven 3.6+
```

---

## Running the Application

### Option 1: Using Helper Scripts (Easiest)

**Terminal 1 - Start Backend:**
```bash
cd /Users/vanshajsharma/PIP
./start-backend.sh
```

**Terminal 2 - Start Frontend:**
```bash
cd /Users/vanshajsharma/PIP
./start-frontend.sh
```

### Option 2: Manual Commands

**Terminal 1 - Backend:**
```bash
cd /Users/vanshajsharma/PIP/backend-java
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd /Users/vanshajsharma/PIP/frontend
npm install  # First time only
npm run dev
```

---

## Access the Application

1. **Open browser:** http://localhost:3000
2. **Login with:**
   - Email: `admin@pip.com`
   - Password: `admin123`

---

## What's Running?

- **Backend:** http://localhost:3001 (Java Spring Boot)
- **Frontend:** http://localhost:3000 (React + Vite)
- **Database:** H2 (file-based, auto-created)

---

## Troubleshooting

### "Java not found"
```bash
brew install openjdk@17
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
```

### "Maven not found"
```bash
brew install maven
```

### Port 3001 already in use
```bash
lsof -ti:3001 | xargs kill -9
```

### Port 3000 already in use
```bash
lsof -ti:3000 | xargs kill -9
```

---

## Full Documentation

- **Complete Setup:** See `RUN_GUIDE.md`
- **Prerequisites:** See `INSTALL_PREREQUISITES.md`
- **Java Backend:** See `backend-java/README.md`

