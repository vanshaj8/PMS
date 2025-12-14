# PIP Management System - Java Backend

Spring Boot backend for the PIP Management System.

## Prerequisites

- Java 17 or higher
- Maven 3.6+

## Setup

1. **Install dependencies:**
   ```bash
   mvn clean install
   ```

2. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```

   Or use the IDE to run `PipManagementApplication.java`

## Configuration

Edit `src/main/resources/application.yml` to configure:
- Server port (default: 3001)
- Database (H2 for dev, PostgreSQL for production)
- JWT secret and expiration
- CORS allowed origins

## Database

- **Development**: H2 in-memory/file database (auto-configured)
- **Production**: PostgreSQL (uncomment PostgreSQL config in application.yml)

H2 Console: http://localhost:3001/h2-console
- JDBC URL: `jdbc:h2:file:./data/pipdb`
- Username: `sa`
- Password: (empty)

## API Endpoints

All endpoints match the Node.js backend:
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/pips` - List PIPs
- `POST /api/pips` - Create PIP
- `GET /api/pips/:id` - Get PIP details
- `GET /api/users` - List users
- `GET /api/users/for-pip-creation` - Get users for PIP creation
- And all other endpoints from the Node.js backend

## Default Users

Automatically created on first run:
- Admin: admin@pip.com / admin123
- Manager: manager@pip.com / manager123
- Employee: employee@pip.com / employee123
- HRBP: hrbp@pip.com / hrbp123
- Executive: executive@pip.com / executive123

## Building

```bash
mvn clean package
```

The JAR file will be in `target/pip-management-backend-1.0.0.jar`

## Running Production Build

```bash
java -jar target/pip-management-backend-1.0.0.jar
```

