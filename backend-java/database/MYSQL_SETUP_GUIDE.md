# MySQL Setup Guide for PIP Management System

## Prerequisites

- MySQL 8.0 or higher
- Java 17 or higher
- Maven 3.6 or higher
- Spring Boot 3.2.0

---

## Step 1: Install MySQL

### macOS

```bash
# Using Homebrew
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation (set root password)
mysql_secure_installation
```

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install MySQL
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure installation
sudo mysql_secure_installation
```

### Windows

1. Download MySQL Installer from: https://dev.mysql.com/downloads/installer/
2. Run the installer
3. Choose "Developer Default" or "Server only"
4. Follow the installation wizard
5. Set root password during installation

### Verify Installation

```bash
mysql --version
# Should show: mysql Ver 8.0.x
```

---

## Step 2: Create Database and User

### Connect to MySQL

```bash
mysql -u root -p
# Enter your root password when prompted
```

### Create Database

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS pip_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Verify database creation
SHOW DATABASES;
```

### Create Application User

```sql
-- Create user (replace 'your_password' with a strong password)
CREATE USER 'pip_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON pip_management.* TO 'pip_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify user creation
SELECT User, Host FROM mysql.user WHERE User = 'pip_user';
```

### For Remote Connections (Optional)

If you need to connect from a remote machine:

```sql
-- Create user for remote access
CREATE USER 'pip_user'@'%' IDENTIFIED BY 'your_strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON pip_management.* TO 'pip_user'@'%';

-- Apply changes
FLUSH PRIVILEGES;
```

**Security Note**: Using `%` allows connections from any host. For production, specify the exact host IP.

---

## Step 3: Run Database Schema

### Option 1: Using MySQL Command Line

```bash
# Connect to MySQL
mysql -u pip_user -p pip_management

# Run schema file
source /path/to/backend-java/database/schema.sql

# Or directly
mysql -u pip_user -p pip_management < backend-java/database/schema.sql
```

### Option 2: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open `schema.sql` file
4. Execute the script

### Verify Tables Created

```sql
USE pip_management;
SHOW TABLES;

-- Should show:
-- users
-- pips
-- goals
-- pip_steps
-- check_ins
-- audit_logs
-- notifications
-- timeline_overrides
-- goal_library
-- pip_templates
```

---

## Step 4: Load Sample Data (Optional)

```bash
mysql -u pip_user -p pip_management < backend-java/database/sample_data.sql
```

Or in MySQL:

```sql
USE pip_management;
SOURCE /path/to/backend-java/database/sample_data.sql;
```

---

## Step 5: Configure Spring Boot

### Update application.yml

Create or update `src/main/resources/application.yml`:

```yaml
spring:
  profiles:
    active: mysql  # Activate MySQL profile
  
  datasource:
    url: jdbc:mysql://localhost:3306/pip_management?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&useUnicode=true&characterEncoding=utf8mb4
    username: pip_user
    password: your_strong_password_here
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### Or Use Environment Variables

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pip_management?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&useUnicode=true&characterEncoding=utf8mb4
    username: ${DB_USERNAME:pip_user}
    password: ${DB_PASSWORD:your_strong_password_here}
```

Then set environment variables:

```bash
export DB_USERNAME=pip_user
export DB_PASSWORD=your_strong_password_here
```

---

## Step 6: Update pom.xml

The MySQL connector dependency should already be in `pom.xml`. Verify:

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

If not present, add it and run:

```bash
mvn clean install
```

---

## Step 7: Update Entity Classes

Ensure your entity classes use proper JPA annotations. The existing entities should work, but verify:

1. `@Entity` annotation is present
2. `@Table(name = "...")` matches database table names
3. `@Id` and `@GeneratedValue` are configured
4. Foreign keys use `@ManyToOne` or `@OneToMany` with `@JoinColumn`

---

## Step 8: Configure JPA Settings

### For Development

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # Auto-update schema
    show-sql: true      # Show SQL queries
```

### For Production

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # Only validate, don't modify
    show-sql: false        # Don't show SQL
```

---

## Step 9: Test Connection

### Start the Application

```bash
cd backend-java
mvn spring-boot:run
```

### Check Logs

Look for:
```
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
```

If you see connection errors, check:
1. MySQL is running: `mysql -u root -p`
2. Database exists: `SHOW DATABASES;`
3. User has permissions: `SHOW GRANTS FOR 'pip_user'@'localhost';`
4. Connection string is correct
5. Password is correct

---

## Step 10: Verify Data

### Check Tables

```sql
USE pip_management;

-- Check users
SELECT * FROM users;

-- Check pips
SELECT * FROM pips;

-- Check goals
SELECT * FROM goals;
```

### Test Application

1. Start the backend
2. Try to log in with sample user: `admin@pip.com` / `password123`
3. Check if data loads correctly

---

## Troubleshooting

### Error: "Access denied for user"

**Solution**: 
- Verify username and password
- Check user has privileges: `SHOW GRANTS FOR 'pip_user'@'localhost';`
- Recreate user if needed

### Error: "Unknown database 'pip_management'"

**Solution**:
- Create database: `CREATE DATABASE pip_management;`
- Verify: `SHOW DATABASES;`

### Error: "Table doesn't exist"

**Solution**:
- Run schema.sql: `mysql -u pip_user -p pip_management < schema.sql`
- Check tables: `SHOW TABLES;`

### Error: "Connection refused"

**Solution**:
- Check MySQL is running: `sudo systemctl status mysql` (Linux) or `brew services list` (macOS)
- Start MySQL: `sudo systemctl start mysql` or `brew services start mysql`
- Check port 3306 is not blocked by firewall

### Error: "Public Key Retrieval is not allowed"

**Solution**:
- Add to connection URL: `&allowPublicKeyRetrieval=true`
- Or update MySQL user: `ALTER USER 'pip_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';`

### Error: "The server time zone value 'XYZ' is unrecognized"

**Solution**:
- Add to connection URL: `&serverTimezone=UTC`
- Or set MySQL timezone: `SET GLOBAL time_zone = '+00:00';`

---

## Production Considerations

### 1. Use Connection Pooling

HikariCP is already configured. Adjust pool size based on load:

```yaml
spring:
  datasource:
    hikari:
      minimum-idle: 10
      maximum-pool-size: 50
```

### 2. Use SSL for Production

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pip_management?useSSL=true&requireSSL=true&serverTimezone=UTC
```

### 3. Use Environment Variables for Credentials

Never hardcode passwords. Use environment variables or secrets management.

### 4. Enable Query Logging (for debugging)

```yaml
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

### 5. Regular Backups

```bash
# Backup database
mysqldump -u pip_user -p pip_management > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u pip_user -p pip_management < backup_20241214.sql
```

### 6. Monitor Performance

- Use MySQL's performance schema
- Monitor slow query log
- Use EXPLAIN for query optimization

---

## Migration from H2 to MySQL

If you're currently using H2 and want to migrate:

1. **Export H2 data** (if needed):
   - Use H2 console to export data
   - Or write a migration script

2. **Create MySQL schema**:
   - Run `schema.sql`

3. **Update configuration**:
   - Change `application.yml` to use MySQL profile
   - Update connection details

4. **Migrate data** (if needed):
   - Write SQL scripts to transfer data
   - Or use Spring Batch for large datasets

5. **Test thoroughly**:
   - Verify all features work
   - Check data integrity
   - Test performance

---

## Quick Reference

### Common MySQL Commands

```sql
-- Connect
mysql -u pip_user -p pip_management

-- Show databases
SHOW DATABASES;

-- Use database
USE pip_management;

-- Show tables
SHOW TABLES;

-- Describe table
DESCRIBE users;

-- Show table structure
SHOW CREATE TABLE users;

-- Count records
SELECT COUNT(*) FROM users;

-- Check user privileges
SHOW GRANTS FOR 'pip_user'@'localhost';
```

### Connection String Format

```
jdbc:mysql://[host]:[port]/[database]?[parameters]
```

**Example**:
```
jdbc:mysql://localhost:3306/pip_management?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&useUnicode=true&characterEncoding=utf8mb4
```

---

## Support

For issues:
1. Check MySQL error logs: `/var/log/mysql/error.log` (Linux) or check MySQL Workbench
2. Verify Spring Boot logs for connection errors
3. Test connection manually: `mysql -u pip_user -p pip_management`
4. Check firewall and network settings

---

**Next Steps**: After setup, refer to `DATABASE_SCHEMA.md` for detailed schema documentation and `repository-examples.md` for repository usage examples.
