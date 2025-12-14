# MySQL Database Setup Guide

This guide will help you set up MySQL database for the PIP Management System.

---

## Prerequisites

- MySQL Server 8.0 or higher installed
- MySQL client (mysql command-line tool)
- Java 17+ installed
- Maven installed

---

## Step 1: Install MySQL

### macOS (using Homebrew)
```bash
brew install mysql
brew services start mysql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Windows
1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Run the installer and follow the setup wizard
3. Remember the root password you set

### Verify Installation
```bash
mysql --version
# Should show: mysql Ver 8.0.x or higher
```

---

## Step 2: Secure MySQL Installation (Linux/macOS)

```bash
sudo mysql_secure_installation
```

Follow the prompts:
- Set root password (if not already set)
- Remove anonymous users: Yes
- Disallow root login remotely: Yes (unless needed)
- Remove test database: Yes
- Reload privilege tables: Yes

---

## Step 3: Create Database and User

### Option A: Using MySQL Command Line

1. **Login to MySQL as root:**
```bash
mysql -u root -p
# Enter your root password when prompted
```

2. **Create the database:**
```sql
CREATE DATABASE pip_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

3. **Create a dedicated user:**
```sql
CREATE USER 'pip_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
```

4. **Grant privileges:**
```sql
GRANT ALL PRIVILEGES ON pip_management.* TO 'pip_user'@'localhost';
FLUSH PRIVILEGES;
```

5. **Verify the user:**
```sql
SHOW GRANTS FOR 'pip_user'@'localhost';
```

6. **Exit MySQL:**
```sql
EXIT;
```

### Option B: Using SQL Script

Create a file `setup-database.sql`:

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS pip_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER IF NOT EXISTS 'pip_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON pip_management.* TO 'pip_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
```

Run the script:
```bash
mysql -u root -p < setup-database.sql
```

---

## Step 4: Create Tables

### Option A: Using the Schema SQL File

```bash
mysql -u pip_user -p pip_management < database/schema.sql
```

### Option B: Using MySQL Command Line

```bash
mysql -u pip_user -p pip_management
```

Then paste the contents of `database/schema.sql` or run:
```sql
SOURCE /path/to/backend-java/database/schema.sql;
```

### Verify Tables Created

```sql
USE pip_management;
SHOW TABLES;
```

You should see:
- users
- pips
- goals
- pip_steps
- check_ins
- audit_logs

---

## Step 5: Configure Spring Boot

### Update application.yml

1. **Copy the MySQL configuration:**
```bash
cp src/main/resources/application-mysql.yml src/main/resources/application.yml
```

2. **Edit `application.yml` and update:**
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pip_management?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=utf8mb4&useUnicode=true
    username: pip_user
    password: your_secure_password_here  # Change this!
```

3. **Set DDL mode:**
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # Use 'validate' in production
```

For development, you can use:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # Automatically update schema
```

---

## Step 6: Test the Connection

### Start the Spring Boot Application

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
1. MySQL is running: `mysqladmin -u root -p ping`
2. Database exists: `mysql -u root -p -e "SHOW DATABASES;"`
3. User has correct password
4. Firewall allows connections (if remote)

---

## Step 7: Verify Data Persistence

1. **Login to the application**
2. **Create a test PIP or user**
3. **Check database:**
```bash
mysql -u pip_user -p pip_management
```

```sql
SELECT * FROM users;
SELECT * FROM pips;
```

---

## Remote Database Setup (Optional)

If MySQL is on a different server:

### 1. Allow Remote Connections

Edit MySQL config file:
- **Linux**: `/etc/mysql/mysql.conf.d/mysqld.cnf`
- **macOS**: `/usr/local/etc/my.cnf` or `/opt/homebrew/etc/my.cnf`

Find and comment out:
```ini
# bind-address = 127.0.0.1
```

Or change to:
```ini
bind-address = 0.0.0.0
```

Restart MySQL:
```bash
# Linux
sudo systemctl restart mysql

# macOS
brew services restart mysql
```

### 2. Create Remote User

```sql
CREATE USER 'pip_user'@'%' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON pip_management.* TO 'pip_user'@'%';
FLUSH PRIVILEGES;
```

### 3. Update Spring Boot Configuration

```yaml
spring:
  datasource:
    url: jdbc:mysql://your-mysql-server:3306/pip_management?useSSL=true&serverTimezone=UTC
```

### 4. Configure Firewall

Allow MySQL port (3306) through firewall:
```bash
# Linux (UFW)
sudo ufw allow 3306/tcp

# Linux (firewalld)
sudo firewall-cmd --add-port=3306/tcp --permanent
sudo firewall-cmd --reload
```

---

## Security Best Practices

### 1. Use Strong Passwords
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Don't use default passwords

### 2. Limit User Privileges
- Only grant necessary privileges
- Use specific database user (not root)
- Restrict host access (`localhost` vs `%`)

### 3. Enable SSL (Production)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pip_management?useSSL=true&requireSSL=true&serverTimezone=UTC
```

### 4. Regular Backups
```bash
# Backup database
mysqldump -u pip_user -p pip_management > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u pip_user -p pip_management < backup_20241214.sql
```

### 5. Monitor Connections
```sql
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
```

---

## Troubleshooting

### Error: "Access denied for user"
- Check username and password
- Verify user exists: `SELECT user, host FROM mysql.user;`
- Check privileges: `SHOW GRANTS FOR 'pip_user'@'localhost';`

### Error: "Unknown database"
- Verify database exists: `SHOW DATABASES;`
- Check database name in connection URL

### Error: "Connection refused"
- Check MySQL is running: `mysqladmin -u root -p ping`
- Check port: `netstat -an | grep 3306`
- Check firewall settings

### Error: "Table doesn't exist"
- Run schema.sql to create tables
- Check DDL mode in application.yml
- Verify you're connected to correct database

### Error: "Character set issues"
- Ensure database uses utf8mb4
- Check connection URL includes `characterEncoding=utf8mb4`
- Verify table collation: `SHOW TABLE STATUS LIKE 'users';`

### Performance Issues
- Check connection pool size
- Monitor slow queries: `SHOW VARIABLES LIKE 'slow_query_log';`
- Add indexes for frequently queried columns
- Use EXPLAIN to analyze queries

---

## Connection Pool Tuning

Adjust HikariCP settings based on your load:

```yaml
spring:
  datasource:
    hikari:
      minimum-idle: 5          # Minimum connections
      maximum-pool-size: 20    # Maximum connections
      connection-timeout: 30000 # 30 seconds
      idle-timeout: 300000     # 5 minutes
      max-lifetime: 1800000    # 30 minutes
```

**Guidelines:**
- `maximum-pool-size`: 2-4x number of CPU cores
- `minimum-idle`: 25-50% of maximum
- Monitor with: `SHOW STATUS LIKE 'Threads_connected';`

---

## Migration from H2 to MySQL

If you're currently using H2 and want to migrate:

1. **Export H2 data:**
   - Use H2 console to export data
   - Or use Spring Boot data migration

2. **Create MySQL schema:**
   ```bash
   mysql -u pip_user -p pip_management < database/schema.sql
   ```

3. **Import data:**
   - Write migration script
   - Or use Spring Boot's data migration tools

4. **Update configuration:**
   - Switch from H2 to MySQL in application.yml
   - Test thoroughly

---

## Next Steps

1. ✅ Database created and configured
2. ✅ Tables created
3. ✅ Spring Boot connected
4. ✅ Test application
5. ✅ Set up regular backups
6. ✅ Monitor performance
7. ✅ Plan for production deployment

---

## Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Spring Boot Data Access](https://docs.spring.io/spring-boot/docs/current/reference/html/data.html)
- [HikariCP Configuration](https://github.com/brettwooldridge/HikariCP)

---

## Quick Reference

### Common MySQL Commands

```sql
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

-- Show current connections
SHOW PROCESSLIST;

-- Show database size
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'pip_management'
GROUP BY table_schema;
```

---

*Last Updated: 2024*
