# Performance Improvement Plan (PIP) Management System

A comprehensive Performance Improvement Plan management system with multi-role support, workflow automation, timeline management, and advanced reporting.

## Features

### User Roles
- **Manager**: Create and manage PIPs, review employee progress
- **Employee**: Review, acknowledge, and complete self-reviews
- **HRBP**: Review and make final decisions on PIPs
- **Admin**: Full system administration, user management
- **Executive**: Read-only dashboards and analytics

### Core Workflow
1. Manager initiates PIP with goals and timelines
2. HRBP reviews and approves/denies/sends back
3. Employee reviews and acknowledges
4. Active PIP period with check-ins
5. Employee self-review
6. Manager final review
7. HRBP final decision

### Key Features
- Timeline management with admin override capabilities
- Role-specific dashboards
- Comprehensive reporting (PDF, CSV, Excel)
- Audit logging and digital signatures
- Goal tracking with weightage
- Multi-manager support
- Advanced search and filtering
- Check-in tracking during active PIP period

## Tech Stack

- **Frontend**: React + TypeScript + Material-UI + Vite
- **Backend**: Java 17 + Spring Boot 3.2.0
- **Database**: MySQL 8.0+
- **Authentication**: JWT
- **Build Tool**: Maven

## Prerequisites

- **Java 17** (required)
- **Maven 3.6+**
- **MySQL 8.0+**
- **Node.js 18+** (for frontend)
- **npm** or **yarn**

## Quick Start

### 1. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Run schema
cd backend-java/database
mysql -u root -p pip_management < schema.sql
```

### 2. Backend Configuration

Edit `backend-java/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pip_management
    username: root
    password: your_password
```

### 3. Start Backend

```bash
cd backend-java
./start-backend.sh
# Or manually:
source ~/.zshrc  # Sets Java 17
mvn spring-boot:run
```

Backend runs on: **http://localhost:8080**

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**

## Default Login Credentials

**All users use the password: `password123`**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pip.com | password123 |
| Manager | manager@pip.com | password123 |
| Employee | employee@pip.com | password123 |
| HRBP | hrbp@pip.com | password123 |
| Executive | executive@pip.com | password123 |

### Additional Test Users

The system includes 30 additional users (10 managers, 10 employees, 10 HRBPs) for testing. All use `password123`.

## Project Structure

```
PIP/
├── backend-java/          # Spring Boot API server
│   ├── src/
│   │   ├── main/java/     # Java source code
│   │   │   ├── controller/ # REST controllers
│   │   │   ├── service/    # Business logic
│   │   │   ├── model/      # Entity models
│   │   │   ├── repository/ # Data access
│   │   │   └── security/   # Security config
│   │   └── resources/      # Configuration files
│   ├── database/          # Database scripts
│   │   ├── schema.sql     # MySQL schema
│   │   └── *.sql          # Test data scripts
│   └── pom.xml            # Maven dependencies
├── frontend/              # React application
│   └── src/
│       ├── components/    # React components
│       ├── pages/         # Page components
│       ├── services/      # API services
│       └── contexts/      # React contexts
└── shared/                # Shared TypeScript types
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### PIPs
- `GET /api/pips` - List PIPs (role-based filtering)
- `POST /api/pips` - Create PIP
- `GET /api/pips/:id` - Get PIP details
- `PUT /api/pips/:id` - Update PIP
- `PUT /api/pips/:id/steps/:stepName` - Update step status

### Users
- `GET /api/users` - List users (Admin only)
- `GET /api/users/for-pip-creation` - Get users for PIP creation
- `POST /api/users` - Create user (Admin only)

### Health
- `GET /api/health` - Health check

## Development

### Backend Development

```bash
cd backend-java
mvn spring-boot:run
```

**Important**: Ensure Java 17 is set:
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Building for Production

**Backend:**
```bash
cd backend-java
mvn clean package
java -jar target/pip-management-backend-1.0.0.jar
```

**Frontend:**
```bash
cd frontend
npm run build
# Output in dist/
```

## Database

- **Database Name**: `pip_management`
- **Tables**: users, pips, goals, pip_steps, check_ins, audit_logs
- **Schema**: See `backend-java/database/schema.sql`
- **Test Data**: See `backend-java/database/create_random_users.sql`

## Configuration

### Backend Configuration
- **Port**: 8080 (configurable in `application.yml`)
- **JWT Secret**: Configured in `application.yml`
- **CORS**: Configured for `localhost:5173`, `localhost:5174`, `localhost:3000`

### Frontend Configuration
- **API Base URL**: `http://localhost:8080` (default)
- **Port**: 5173 (Vite default)

## Troubleshooting

### Java Version Issues
If you see compilation errors, ensure Java 17 is active:
```bash
java -version  # Should show 17.x.x
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

### Database Connection Issues
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `application.yml`
- Verify database exists: `SHOW DATABASES;`

### Port Already in Use
- Backend: Change port in `application.yml` or kill process on 8080
- Frontend: Vite will automatically use next available port

## Documentation

- **Database Setup**: `backend-java/database/MYSQL_SETUP_GUIDE.md`
- **API Examples**: `frontend/API_USAGE_EXAMPLES.md`
- **How to Run**: `backend-java/HOW_TO_RUN.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`

## License

ISC

---

**Last Updated**: December 2025
