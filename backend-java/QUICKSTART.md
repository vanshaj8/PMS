# Quick Start Guide - Java Backend

## Prerequisites
- **Java 17** (required - project won't compile with Java 25+)
- **Maven 3.6+**
- **MySQL 8.0+**

## Setup & Run

### 1. Set Java 17

```bash
# macOS (Homebrew)
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

# Verify
java -version  # Should show 17.x.x
```

### 2. Database Setup (First Time)

```bash
# Create database
mysql -u root -p
CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Run schema
cd database
mysql -u root -p pip_management < schema.sql
```

### 3. Configure Application

Edit `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pip_management
    username: root
    password: your_mysql_password
```

### 4. Build and Run

```bash
# Navigate to backend-java directory
cd backend-java

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

Or use your IDE to run `PipManagementApplication.java`

## Default Configuration

- **Port:** 8080
- **Database:** MySQL (pip_management)
- **CORS:** Enabled for http://localhost:5173, http://localhost:5174, http://localhost:3000

## Default Users

Automatically created on first run (all use password: `password123`):
- **Admin:** admin@pip.com / password123
- **Manager:** manager@pip.com / password123
- **Employee:** employee@pip.com / password123
- **HRBP:** hrbp@pip.com / password123
- **Executive:** executive@pip.com / password123

### Additional Test Users

30 additional users available (see `database/create_random_users.sql`). All use `password123`.

## API Endpoints

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/pips` - List PIPs (filtered by role)
- `POST /api/pips` - Create PIP (Manager only)
- `GET /api/pips/:id` - Get PIP details
- `PUT /api/pips/:id/steps/:stepName` - Update step status
- `GET /api/users` - List users (Admin only)
- `GET /api/users/for-pip-creation` - Get users for PIP creation
- `GET /api/health` - Health check

## Frontend Integration

The frontend connects to:
- **API Base URL:** http://localhost:8080
- **Frontend URL:** http://localhost:5173

## Database Access

Connect via MySQL client:
```bash
mysql -u root -p pip_management
```

Or use MySQL Workbench / DBeaver / TablePlus:
- Host: localhost
- Port: 3306
- Database: pip_management
- Username: root
- Password: (your MySQL password)

## Troubleshooting

- **Port already in use:** Change port in `application.yml` or kill process: `lsof -ti:8080 | xargs kill -9`
- **Compilation errors:** Ensure Java 17 is active: `java -version` (must show 17.x.x)
- **Maven not found:** Install Maven: `brew install maven`
- **Database connection error:** Verify MySQL is running and credentials are correct
- **Java version error:** Use Java 17, not Java 25+

## Quick Commands

```bash
# Start backend
cd backend-java
./start-backend.sh

# Or manually
source ~/.zshrc  # Sets Java 17
mvn spring-boot:run

# Check health
curl http://localhost:8080/api/health
```

---

**Last Updated:** December 2025
