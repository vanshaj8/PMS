# PIP Management System - Java Backend

Spring Boot backend for the PIP Management System using Java 17, Spring Boot 3.2.0, and MySQL.

## Prerequisites

- **Java 17** (required - project won't compile with Java 25+)
- **Maven 3.6+**
- **MySQL 8.0+**

## Quick Start

### 1. Set Java 17

```bash
# macOS (Homebrew)
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

# Verify
java -version  # Should show 17.x.x
```

Or add to `~/.zshrc`:
```bash
if [ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
    export PATH=$JAVA_HOME/bin:$PATH
fi
```

### 2. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

### 4. Run Application

**Option 1: Using script**
```bash
./start-backend.sh
```

**Option 2: Using Maven**
```bash
mvn spring-boot:run
```

**Option 3: Using IDE**
- Run `PipManagementApplication.java` as Java Application

The application will start on **http://localhost:8080**

## Configuration

### Application Properties

Edit `src/main/resources/application.yml`:

- **Server Port**: Default `8080`
- **Database**: MySQL connection settings
- **JWT Secret**: Change in production
- **CORS**: Configured for frontend origins

### Database Configuration

- **Development/Production**: MySQL
- **Connection Pool**: HikariCP (configured in `application.yml`)
- **JPA**: Hibernate with MySQL dialect
- **DDL Auto**: `none` (schema managed manually)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### PIPs
- `GET /api/pips` - List PIPs (role-based)
- `POST /api/pips` - Create PIP
- `GET /api/pips/:id` - Get PIP details
- `PUT /api/pips/:id/steps/:stepName` - Update step

### Users
- `GET /api/users` - List users (Admin only)
- `GET /api/users/for-pip-creation` - Get users for PIP creation
- `POST /api/users` - Create user (Admin only)

### Health
- `GET /api/health` - Health check

## Default Users

Automatically created on first run (all use password: `password123`):

- **Admin**: admin@pip.com / password123
- **Manager**: manager@pip.com / password123
- **Employee**: employee@pip.com / password123
- **HRBP**: hrbp@pip.com / password123
- **Executive**: executive@pip.com / password123

### Additional Test Users

30 additional users are available (10 managers, 10 employees, 10 HRBPs). See `database/create_random_users.sql`.

## Building

```bash
mvn clean package
```

The JAR file will be in `target/pip-management-backend-1.0.0.jar`

## Running Production Build

```bash
java -jar target/pip-management-backend-1.0.0.jar
```

## Project Structure

```
backend-java/
├── src/
│   ├── main/
│   │   ├── java/com/pip/
│   │   │   ├── controller/    # REST controllers
│   │   │   ├── service/        # Business logic
│   │   │   ├── model/          # Entity models
│   │   │   ├── repository/     # Data access layer
│   │   │   ├── security/       # Security configuration
│   │   │   ├── config/         # Configuration classes
│   │   │   └── util/           # Utility classes
│   │   └── resources/
│   │       ├── application.yml # Main configuration
│   │       └── application-mysql.yml # MySQL config example
│   └── test/                   # Test files
├── database/                   # Database scripts
│   ├── schema.sql             # MySQL schema
│   ├── create_random_users.sql # Test users
│   └── *.md                   # Documentation
└── pom.xml                     # Maven dependencies
```

## Dependencies

Key dependencies (see `pom.xml` for full list):
- Spring Boot 3.2.0
- Spring Data JPA
- Spring Security
- MySQL Connector
- JWT (jjwt 0.12.3)
- Lombok
- Apache POI (for Excel processing)

## Development

### Running Tests
```bash
mvn test
```

### Code Formatting
The project uses standard Java formatting. Consider using:
- IntelliJ IDEA code formatter
- Eclipse formatter
- Google Java Style Guide

### Logging
- Logging level: DEBUG for `com.pip` package
- Logs output to console
- Configure in `application.yml`

## Troubleshooting

### Java Version Error
```
Error: incompatible types: java.lang.String cannot be converted to java.time.LocalDateTime
```
**Solution**: Use Java 17, not Java 25+
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

### Database Connection Error
```
Communications link failure
```
**Solution**: 
- Verify MySQL is running
- Check credentials in `application.yml`
- Verify database exists

### Port Already in Use
```
Port 8080 is already in use
```
**Solution**: 
- Change port in `application.yml`
- Or kill process: `lsof -ti:8080 | xargs kill -9`

## Documentation

- **Database Setup**: `database/MYSQL_SETUP_GUIDE.md`
- **How to Run**: `HOW_TO_RUN.md`
- **API Contract**: `API_CONTRACT.md`
- **Quick Start**: `QUICKSTART.md`

## License

ISC

---

**Last Updated**: December 2025
