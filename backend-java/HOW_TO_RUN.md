# How to Run the Backend

This guide provides multiple ways to run the Spring Boot backend application.

## Prerequisites

- **Java 17 or higher**
  - Check version: `java -version`
  - Install on macOS: `brew install openjdk@17`
  - Install on Linux: `sudo apt install openjdk-17-jdk`
  - Install on Windows: Download from [Oracle](https://www.oracle.com/java/technologies/downloads/#java17) or use [Adoptium](https://adoptium.net/)

- **Maven 3.6+**
  - Check version: `mvn -version`
  - Install on macOS: `brew install maven`
  - Install on Linux: `sudo apt install maven`
  - Install on Windows: Download from [Maven](https://maven.apache.org/download.cgi)

## Method 1: Using the Start Script (Easiest)

From the project root directory:

```bash
./start-backend.sh
```

Or make it executable first:
```bash
chmod +x start-backend.sh
./start-backend.sh
```

This script will:
- Check Java and Maven are installed
- Build the project if needed
- Start the backend on port 8080

---

## Method 2: Using Maven Command

Navigate to the backend directory:

```bash
cd backend-java
mvn spring-boot:run
```

**First time?** Build first:
```bash
cd backend-java
mvn clean install
mvn spring-boot:run
```

---

## Method 3: Run from Main Class (VS Code)

1. **Open in VS Code**
   ```bash
   cd backend-java
   code .
   ```

2. **Open the main class**
   - Navigate to: `src/main/java/com/pip/PipManagementApplication.java`

3. **Run the application**
   - Click the "Run" button (▶️) next to the `main` method
   - Or press `F5` and select "Launch PipManagementApplication"
   - Or right-click the file → "Run Java"

---

## Method 4: Build JAR and Run

Build the executable JAR:

```bash
cd backend-java
mvn clean package
```

Run the JAR:

```bash
java -jar target/pip-management-backend-1.0.0.jar
```

---

## Verify Backend is Running

Once started, you should see output like:

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.0)

Started PipManagementApplication in X.XXX seconds
```

**Test the health endpoint:**

```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{"status":"ok","service":"PIP Management Backend"}
```

Or open in browser: http://localhost:8080/api/health

---

## Configuration

### Port
- Default port: **8080**
- Configured in: `src/main/resources/application.yml`
- Change by editing: `server.port: 8080`

### Database
- Uses H2 database (file-based)
- Database file: `./data/pipdb.mv.db`
- H2 Console: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:file:./data/pipdb`
  - Username: `sa`
  - Password: (empty)

### CORS
- Enabled for: `http://localhost:5173` (frontend)
- Configured in: `SecurityConfig.java`

---

## Troubleshooting

### Port Already in Use

**Error**: `Port 8080 is already in use`

**Solution**:
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

Or change the port in `application.yml`:
```yaml
server:
  port: 8081  # Use a different port
```

### Java Version Error

**Error**: `Unsupported class file major version`

**Solution**: Ensure Java 17+ is installed and active:
```bash
# Check version
java -version

# On macOS, set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Maven Build Fails

**Error**: `Could not resolve dependencies`

**Solution**:
```bash
# Clean and rebuild
cd backend-java
mvn clean install -U

# If still failing, check internet connection
# Maven needs to download dependencies
```

### Database Lock Error

**Error**: `Database may be already in use`

**Solution**:
```bash
# Stop all running instances
# Delete database files (WARNING: This deletes all data!)
cd backend-java
rm -rf data/
# Restart backend to recreate database
```

---

## Running in Background

### Using `nohup` (Linux/macOS)

```bash
cd backend-java
nohup mvn spring-boot:run > backend.log 2>&1 &
```

Check logs:
```bash
tail -f backend.log
```

Stop:
```bash
# Find process
ps aux | grep spring-boot

# Kill process
kill <PID>
```

### Using `screen` (Linux/macOS)

```bash
# Start screen session
screen -S backend

# Run backend
cd backend-java
mvn spring-boot:run

# Detach: Press Ctrl+A then D
# Reattach: screen -r backend
```

---

## Development Tips

### Hot Reload with Spring Boot DevTools

The project includes Spring Boot DevTools for automatic restarts:
- Changes to Java files trigger automatic restart
- Changes to `application.yml` require manual restart

### Debug Mode

Run with debug port enabled:

```bash
cd backend-java
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
```

Then attach debugger to port 5005.

### View Logs

Logs are printed to console. To save to file:

```bash
cd backend-java
mvn spring-boot:run > logs/backend.log 2>&1
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Run backend | `cd backend-java && mvn spring-boot:run` |
| Build project | `cd backend-java && mvn clean install` |
| Run JAR | `java -jar backend-java/target/pip-management-backend-1.0.0.jar` |
| Check health | `curl http://localhost:8080/api/health` |
| View H2 console | Open http://localhost:8080/h2-console |

---

## Next Steps

Once the backend is running:
1. Start the frontend: `cd frontend && npm run dev`
2. Open browser: http://localhost:5173
3. Test the application!

For more information, see:
- `PROJECT_SEPARATION.md` - Architecture overview
- `API_CONTRACT.md` - API documentation
- `QUICK_START_SEPARATED.md` - Quick start guide
