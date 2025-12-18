# PIP Management System - Setup Guide

## Prerequisites

- **Java 17** (required - project won't compile with Java 25+)
- **Maven 3.6+**
- **MySQL 8.0+**
- **Node.js 18+** and npm (for frontend)
- **Modern web browser**

## Installation

### 1. Install Java 17

**macOS (Homebrew):**
```bash
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

**Add to ~/.zshrc for persistence:**
```bash
if [ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
    export PATH=$JAVA_HOME/bin:$PATH
fi
```

**Verify:**
```bash
java -version  # Should show 17.x.x
```

### 2. Install Maven

**macOS:**
```bash
brew install maven
```

**Verify:**
```bash
mvn -version
```

### 3. Install MySQL

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux:**
```bash
sudo apt install mysql-server
sudo systemctl start mysql
```

### 4. Install Node.js and npm

**macOS:**
```bash
brew install node
```

**Or download from:** https://nodejs.org/

**Verify:**
```bash
node -v
npm -v
```

## Database Setup

### 1. Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 2. Run Schema

```bash
cd backend-java/database
mysql -u root -p pip_management < schema.sql
```

### 3. Create Test Users (Optional)

```bash
# Create 30 test users
mysql -u root -p pip_management < create_random_users.sql

# Assign manager and HRBP relationships
mysql -u root -p pip_management < assign_all_employee_relationships.sql

# Set all passwords to password123
mysql -u root -p pip_management < update_all_passwords.sql
```

## Backend Configuration

### 1. Configure Database Connection

Edit `backend-java/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pip_management?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: root
    password: your_mysql_password
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### 2. Install Backend Dependencies

```bash
cd backend-java
mvn clean install
```

## Frontend Setup

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Configure API URL (Optional)

Create `frontend/.env.local`:
```
VITE_API_BASE_URL=http://localhost:8080
```

## Running the Application

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd backend-java
./start-backend.sh
# Or manually:
source ~/.zshrc  # Sets Java 17
mvn spring-boot:run
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/api/health

## Default Users

**All users use the password: `password123`**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pip.com | password123 |
| Manager | manager@pip.com | password123 |
| Employee | employee@pip.com | password123 |
| HRBP | hrbp@pip.com | password123 |
| Executive | executive@pip.com | password123 |

### Additional Test Users

30 additional users are available (10 managers, 10 employees, 10 HRBPs). All use `password123`.

## Features Overview

### Manager Role
- Create PIPs for employees
- Set goals with weightages
- Configure timelines
- Review employee self-reviews
- Submit manager reviews

### Employee Role
- View assigned PIPs
- Acknowledge PIPs
- Submit self-reviews
- Add check-ins during active PIP period

### HRBP Role
- Review and approve/deny PIPs
- Make final decisions
- View all PIPs in their scope

### Admin Role
- Manage users
- Override timelines
- View audit logs
- System configuration
- Import users from Excel/CSV

### Executive Role
- Read-only dashboards
- View organization-wide metrics
- Export reports

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### PIPs
- `GET /api/pips` - List PIPs (filtered by role)
- `GET /api/pips/:id` - Get PIP details
- `POST /api/pips` - Create PIP (Manager only)
- `PUT /api/pips/:id/steps/:stepName` - Update step status

### Users
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/for-pip-creation` - Get users for PIP creation
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/pips-by-status` - Get PIPs grouped by status
- `GET /api/dashboard/overdue-pips` - Get overdue PIPs

### Health
- `GET /api/health` - Health check

## Data Storage

The system uses **MySQL** for data storage:
- **Database**: `pip_management`
- **Tables**: users, pips, goals, pip_steps, check_ins, audit_logs
- **Schema**: See `backend-java/database/schema.sql`

## Security Notes

- Passwords are hashed using BCrypt
- JWT tokens are used for authentication
- Role-based access control is enforced
- All actions are logged in audit trail
- CORS configured for frontend origins

## Troubleshooting

1. **Port already in use:**
   - Backend (8080): `lsof -ti:8080 | xargs kill -9`
   - Frontend (5173): Vite will automatically use next available port

2. **Java version error:**
   - Ensure Java 17 is active: `java -version`
   - Set JAVA_HOME to Java 17 path

3. **Database connection issues:**
   - Verify MySQL is running: `mysql -u root -p`
   - Check credentials in `application.yml`
   - Verify database exists: `SHOW DATABASES;`

4. **CORS errors:**
   - Ensure backend CORS allows `http://localhost:5173`
   - Check `SecurityConfig.java` in backend

5. **Authentication issues:**
   - Clear browser localStorage
   - Verify JWT secret is set in `application.yml`
   - Check that user exists in database

## Building for Production

### Backend

```bash
cd backend-java
mvn clean package
java -jar target/pip-management-backend-1.0.0.jar
```

### Frontend

```bash
cd frontend
npm run build
# Output in dist/
```

## Next Steps

- Configure email notifications (optional)
- Set up file upload handling for attachments
- Add unit and integration tests
- Set up CI/CD pipeline
- Configure production database
- Set up monitoring and logging

---

**Last Updated**: December 2025
