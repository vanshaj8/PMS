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

## Database Setup (First Time Only)

```bash
# Create database
mysql -u root -p
CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Run schema
cd backend-java/database
mysql -u root -p pip_management < schema.sql

# Create test users (optional)
mysql -u root -p pip_management < create_random_users.sql
mysql -u root -p pip_management < assign_all_employee_relationships.sql
mysql -u root -p pip_management < update_all_passwords.sql
```

## Configure Backend

Edit `backend-java/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pip_management
    username: root
    password: your_mysql_password
```

## Access the Application

1. **Open browser:** http://localhost:5173
2. **Login with:**
   - Email: `admin@pip.com`
   - Password: `password123`

---

## What's Running?

- **Backend:** http://localhost:8080 (Java Spring Boot)
- **Frontend:** http://localhost:5173 (React + Vite)
- **Database:** MySQL (pip_management database)

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

### Port 8080 already in use
```bash
lsof -ti:8080 | xargs kill -9
```

### Port 5173 already in use
```bash
lsof -ti:5173 | xargs kill -9
```

### Java Version Error
```bash
# Ensure Java 17 is active
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
java -version  # Should show 17.x.x
```

### Database Connection Error
```bash
# Verify MySQL is running
mysql -u root -p

# Check database exists
SHOW DATABASES;
```

---

## Full Documentation

- **Complete Setup:** See `RUN_GUIDE.md`
- **Prerequisites:** See `INSTALL_PREREQUISITES.md`
- **Java Backend:** See `backend-java/README.md`

