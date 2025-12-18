# Complete Setup & Run Guide - PIP Management System

## Prerequisites Check

Before starting, ensure you have the following installed:

### Required Software:
1. **Java 17+** - For Java backend
   ```bash
   java -version
   # Should show version 17 or higher
   ```

2. **Maven 3.6+** - For building Java backend
   ```bash
   mvn -version
   # Should show version 3.6 or higher
   ```

3. **Node.js 18+** - For frontend
   ```bash
   node -version
   # Should show version 18 or higher
   ```

4. **npm** - Comes with Node.js
   ```bash
   npm -version
   ```

---

## Step-by-Step Setup

### Step 1: Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd /Users/vanshajsharma/PIP/frontend

# Install all frontend dependencies
npm install
```

**Expected output:** Dependencies will be installed. This may take 2-5 minutes.

---

### Step 2: Build Java Backend

```bash
# Navigate to Java backend directory
cd /Users/vanshajsharma/PIP/backend-java

# Build the project (downloads dependencies and compiles)
mvn clean install
```

**Expected output:** 
- Maven will download dependencies (first time takes 2-5 minutes)
- Project will compile successfully
- You should see "BUILD SUCCESS" at the end

**If Maven is not installed:**
- **macOS:** `brew install maven`
- **Linux:** `sudo apt-get install maven` or `sudo yum install maven`
- **Windows:** Download from https://maven.apache.org/download.cgi

---

### Step 3: Start Java Backend Server

**Option A: Using Maven (Recommended)**
```bash
# Make sure you're in backend-java directory
cd /Users/vanshajsharma/PIP/backend-java

# Start the Spring Boot application
mvn spring-boot:run
```

**Option B: Using Java directly (after building)**
```bash
cd /Users/vanshajsharma/PIP/backend-java
java -jar target/pip-management-backend-1.0.0.jar
```

**Expected output:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.0)

... (startup logs)
Started PipManagementApplication in X.XXX seconds
```

**Backend will be running on:** http://localhost:8080

**Keep this terminal window open!**

---

### Step 4: Start Frontend Development Server

**Open a NEW terminal window** (keep backend running in the first terminal)

```bash
# Navigate to frontend directory
cd /Users/vanshajsharma/PIP/frontend

# Start the frontend development server
npm run dev
```

**Expected output:**
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Frontend will be running on:** http://localhost:5173

---

### Step 0: Database Setup (First Time Only)

```bash
# Create database
mysql -u root -p
CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Run schema
cd backend-java/database
mysql -u root -p pip_management < schema.sql
```

### Step 5: Access the Application

1. **Open your web browser**
2. **Navigate to:** http://localhost:5173
3. **Login with default credentials (all use password: `password123`):**
   - **Admin:** admin@pip.com / password123
   - **Manager:** manager@pip.com / password123
   - **Employee:** employee@pip.com / password123
   - **HRBP:** hrbp@pip.com / password123
   - **Executive:** executive@pip.com / password123

---

## Quick Start (All-in-One Commands)

If you want to run everything quickly, use these commands in separate terminal windows:

### Terminal 1 - Backend:
```bash
cd /Users/vanshajsharma/PIP/backend-java && mvn spring-boot:run
```

### Terminal 2 - Frontend:
```bash
cd /Users/vanshajsharma/PIP/frontend && npm run dev
```

---

## Verification Steps

### 1. Check Backend Health
Open browser or use curl:
```bash
curl http://localhost:8080/api/health
```
**Expected:** `{"status":"ok","service":"PIP Management Backend"}`

### 2. Check Frontend
Open: http://localhost:5173
**Expected:** Login page should load

### 3. Test Login
- Use admin@pip.com / password123
- Should redirect to dashboard after successful login

---

## Troubleshooting

### Issue: Port 8080 Already in Use

**Solution:** Kill the process using port 8080:
```bash
# Find and kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Or on Windows:
# netstat -ano | findstr :8080
# taskkill /PID <PID> /F
```

### Issue: Port 5173 Already in Use

**Solution:** Vite will automatically use next available port, or kill the process:
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Issue: Maven Build Fails

**Solutions:**
1. **Check Java version:** Must be Java 17+
   ```bash
   java -version
   ```

2. **Clear Maven cache:**
   ```bash
   rm -rf ~/.m2/repository
   mvn clean install
   ```

3. **Check internet connection:** Maven needs to download dependencies

### Issue: Frontend Can't Connect to Backend

**Solutions:**
1. **Verify backend is running:** Check http://localhost:8080/api/health
2. **Check CORS:** Backend should allow http://localhost:5173
3. **Check API URL:** Verify `frontend/src/services/api.ts` points to `http://localhost:8080`
4. **Check environment variable:** Verify `VITE_API_BASE_URL` in `frontend/.env.local`

### Issue: "Default users not created"

**Solution:** This is normal on first run. Users are created automatically. If login fails:
1. Check backend logs for errors
2. Verify database is accessible
3. Try restarting the backend

### Issue: Java Not Found

**Solutions:**
- **macOS:** `brew install openjdk@17`
- **Linux:** `sudo apt-get install openjdk-17-jdk`
- **Windows:** Download from https://adoptium.net/

---

## Stopping the Servers

### Stop Backend:
- Press `Ctrl + C` in the backend terminal

### Stop Frontend:
- Press `Ctrl + C` in the frontend terminal

---

## Development Workflow

### Daily Development:
1. **Start Backend:** `cd backend-java && source ~/.zshrc && mvn spring-boot:run`
2. **Start Frontend:** `cd frontend && npm run dev`
3. **Make changes** - Both servers auto-reload on file changes
4. **Test in browser:** http://localhost:5173

### After Code Changes:
- **Backend:** Restart Spring Boot (Ctrl+C, then `mvn spring-boot:run`)
- **Frontend:** Vite auto-reloads (no restart needed)

---

## Production Build

### Build Frontend:
```bash
cd frontend
npm run build
# Output in: frontend/dist/
```

### Build Backend:
```bash
cd backend-java
mvn clean package
# JAR file: backend-java/target/pip-management-backend-1.0.0.jar
```

### Run Production:
```bash
# Backend
java -jar backend-java/target/pip-management-backend-1.0.0.jar

# Frontend (serve dist folder)
cd frontend
npm run preview
```

---

## Database Access (Development)

The Java backend uses MySQL database:

1. **Connect via MySQL client:**
   ```bash
   mysql -u root -p pip_management
   ```

2. **Or use MySQL Workbench / DBeaver / TablePlus**
   - Host: localhost
   - Port: 3306
   - Database: pip_management
   - Username: root
   - Password: (your MySQL password)

---

## Need Help?

- Check backend logs in the terminal where `mvn spring-boot:run` is running
- Check frontend console in browser (F12 → Console tab)
- Verify both servers are running on correct ports
- Check network tab in browser for API call errors

---

## Summary

✅ **Backend:** http://localhost:8080 (Java Spring Boot)  
✅ **Frontend:** http://localhost:5173 (React + Vite)  
✅ **Database:** MySQL (pip_management database)  
✅ **Default Admin:** admin@pip.com / password123  
✅ **All Users:** All test users use password `password123`

**Both servers must be running simultaneously for the application to work!**

