# Quick Start Guide - Java Backend

## Prerequisites
- Java 17 or higher
- Maven 3.6+

## Setup & Run

1. **Navigate to backend-java directory:**
   ```bash
   cd backend-java
   ```

2. **Build the project:**
   ```bash
   mvn clean install
   ```

3. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```

   Or use your IDE to run `PipManagementApplication.java`

## Default Configuration

- **Port:** 3001 (same as Node.js backend)
- **Database:** H2 (file-based, auto-created)
- **CORS:** Enabled for http://localhost:3000

## Default Users

Automatically created on first run:
- **Admin:** admin@pip.com / admin123
- **Manager:** manager@pip.com / manager123
- **Employee:** employee@pip.com / employee123
- **HRBP:** hrbp@pip.com / hrbp123
- **Executive:** executive@pip.com / executive123

## API Endpoints

All endpoints match the Node.js backend:
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/pips` - List PIPs (filtered by role)
- `POST /api/pips` - Create PIP (Manager only)
- `GET /api/pips/:id` - Get PIP details
- `POST /api/pips/:id/acknowledge` - Employee acknowledgement
- `POST /api/pips/:id/self-review` - Employee self-review
- `POST /api/pips/:id/manager-review` - Manager review
- `POST /api/pips/:id/final-decision` - HRBP final decision
- `GET /api/users` - List users (Admin only)
- `GET /api/users/for-pip-creation` - Get users for PIP creation
- `GET /api/dashboard/stats` - Dashboard statistics

## Frontend Integration

The frontend should work without any changes since:
- All API endpoints match the Node.js backend
- Response formats are identical
- Authentication uses the same JWT format

## Database Access (H2 Console)

1. Start the application
2. Navigate to: http://localhost:3001/h2-console
3. JDBC URL: `jdbc:h2:file:./data/pipdb`
4. Username: `sa`
5. Password: (leave empty)

## Switching to PostgreSQL

1. Uncomment PostgreSQL configuration in `src/main/resources/application.yml`
2. Comment out H2 configuration
3. Create a PostgreSQL database named `pipdb`
4. Restart the application

## Troubleshooting

- **Port already in use:** Change port in `application.yml` or stop the Node.js backend
- **Compilation errors:** Ensure Java 17+ is installed: `java -version`
- **Maven not found:** Install Maven or use Maven wrapper: `./mvnw spring-boot:run`

