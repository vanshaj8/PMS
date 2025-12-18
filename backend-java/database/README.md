# MySQL Database Setup for PIP Management System

This directory contains all MySQL database-related files, scripts, and documentation.

## Files in this Directory

### Schema & Setup
- **schema.sql** - Complete MySQL schema with CREATE TABLE statements
- **sample_data.sql** - Sample data inserts (if available)

### Documentation
- **DATABASE_SCHEMA.md** - Detailed schema documentation
- **MYSQL_SETUP_GUIDE.md** - Step-by-step setup instructions
- **ENTITY_MAPPING_EXAMPLES.md** - JPA entity mapping examples
- **REPOSITORY_EXAMPLES.md** - Spring Data JPA repository examples

### Test Data Scripts
- **create_random_users.sql** - Creates 30 test users (10 managers, 10 employees, 10 HRBPs)
- **assign_all_employee_relationships.sql** - Assigns manager and HRBP to all employees
- **update_all_passwords.sql** - Updates all user passwords to `password123`
- **update_user_relationships.sql** - Updates employee-manager-HRBP relationships
- **create_test_pip_manager_review.sql** - Creates a test PIP ready for manager review

### Utility Scripts
- **fetch_all_users.sql** - Queries to fetch all users with relationships
- **update_all_passwords.sql** - Script to update all passwords

### Documentation Files
- **EMPLOYEE_RELATIONSHIPS.md** - Complete employee-manager-HRBP mapping
- **TEST_CASE_MANAGER_REVIEW.md** - Test case for manager review step
- **TEST_CASE_SUMMARY.md** - Quick reference for test cases

## Quick Start

### 1. Install MySQL (if not already installed)

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

### 2. Create Database and User

```sql
CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pip_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON pip_management.* TO 'pip_user'@'localhost';
FLUSH PRIVILEGES;
```

**Or use root user:**
```sql
CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Create Tables

```bash
mysql -u root -p pip_management < schema.sql
```

### 4. Create Test Users (Optional)

```bash
# Create 30 test users
mysql -u root -p pip_management < create_random_users.sql

# Assign relationships
mysql -u root -p pip_management < assign_all_employee_relationships.sql

# Update all passwords to password123
mysql -u root -p pip_management < update_all_passwords.sql
```

### 5. Configure Spring Boot

Edit `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pip_management?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    database-platform: org.hibernate.dialect.MySQLDialect
    hibernate:
      ddl-auto: none  # Schema managed manually
```

### 6. Start Application

```bash
cd ..
mvn spring-boot:run
```

## Database Schema

### Tables

1. **users** - User accounts (employees, managers, HRBPs, admins)
2. **pips** - Performance Improvement Plans
3. **goals** - Goals within each PIP
4. **pip_steps** - Workflow steps and their status
5. **check_ins** - Progress check-ins during active PIP period
6. **audit_logs** - Audit trail for all changes

### Relationships

- Each PIP has one Employee, one Manager, and one HRBP
- Each PIP has multiple Goals
- Each PIP has multiple Steps (workflow)
- Each PIP has multiple Check-ins
- Employees have manager_id and hrbp_id for PIP assignment

## Default Data

### Default Users (Auto-created)

All use password: `password123`

| Email | Role | Password |
|-------|------|----------|
| admin@pip.com | ADMIN | password123 |
| manager@pip.com | MANAGER | password123 |
| employee@pip.com | EMPLOYEE | password123 |
| hrbp@pip.com | HRBP | password123 |
| executive@pip.com | EXECUTIVE | password123 |

### Test Users (30 additional users)

Created by `create_random_users.sql`:
- 10 Managers
- 10 Employees
- 10 HRBPs

All use password: `password123`

## Common Queries

### Fetch All Users with Relationships
```sql
SELECT 
    u.email as employee_email,
    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
    m.email as manager_email,
    CONCAT(m.first_name, ' ', m.last_name) as manager_name,
    h.email as hrbp_email,
    CONCAT(h.first_name, ' ', h.last_name) as hrbp_name
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
LEFT JOIN users h ON u.hrbp_id = h.id
WHERE u.role = 'EMPLOYEE'
ORDER BY u.last_name;
```

### Check PIP Status
```sql
SELECT 
    p.id,
    p.status,
    CONCAT(e.first_name, ' ', e.last_name) as employee,
    CONCAT(m.first_name, ' ', m.last_name) as manager,
    (SELECT COUNT(*) FROM goals WHERE pip_id = p.id) as goal_count
FROM pips p
JOIN users e ON p.employee_id = e.id
JOIN users m ON p.manager_id = m.id
WHERE p.status = 'PENDING_MANAGER_REVIEW';
```

### View PIP Steps
```sql
SELECT 
    step,
    status,
    due_date,
    completed_date
FROM pip_steps
WHERE pip_id = 'your-pip-id'
ORDER BY CASE step 
    WHEN 'EMPLOYEE_ACKNOWLEDGEMENT' THEN 1
    WHEN 'ACTIVE_PIP' THEN 2
    WHEN 'EMPLOYEE_SELF_REVIEW' THEN 3
    WHEN 'MANAGER_REVIEW' THEN 4
    WHEN 'HRBP_DECISION' THEN 5
END;
```

## Test Data

### Create Test PIP for Manager Review

```bash
mysql -u root -p pip_management < create_test_pip_manager_review.sql
```

This creates a PIP with:
- Status: `PENDING_MANAGER_REVIEW`
- 3 goals with employee responses
- All previous steps completed
- Ready for manager to review

See `TEST_CASE_MANAGER_REVIEW.md` for details.

## Documentation

- **Setup Guide**: `MYSQL_SETUP_GUIDE.md` - Detailed setup instructions
- **Schema Documentation**: `DATABASE_SCHEMA.md` - Table descriptions and relationships
- **Repository Examples**: `REPOSITORY_EXAMPLES.md` - Spring Data JPA query examples
- **Entity Mapping**: `ENTITY_MAPPING_EXAMPLES.md` - JPA annotations and examples
- **Employee Relationships**: `EMPLOYEE_RELATIONSHIPS.md` - Complete relationship mapping

## Configuration Files

Configuration examples are in:
- `../src/main/resources/application-mysql.yml` - YAML format
- `../src/main/resources/application.properties.mysql` - Properties format

## Maintenance

### Backup Database
```bash
mysqldump -u root -p pip_management > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
mysql -u root -p pip_management < backup_20251218.sql
```

### Reset Database (WARNING: Deletes all data)
```bash
mysql -u root -p -e "DROP DATABASE pip_management; CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p pip_management < schema.sql
mysql -u root -p pip_management < create_random_users.sql
```

## Troubleshooting

### Connection Issues
1. Verify MySQL is running: `mysql -u root -p`
2. Check credentials in `application.yml`
3. Verify database exists: `SHOW DATABASES;`
4. Check user permissions: `SHOW GRANTS FOR 'pip_user'@'localhost';`

### Schema Issues
1. Verify schema was applied: `SHOW TABLES;`
2. Check table structure: `DESCRIBE users;`
3. Re-run schema if needed: `mysql -u root -p pip_management < schema.sql`

### Data Issues
1. Check user count: `SELECT COUNT(*) FROM users;`
2. Verify relationships: See `EMPLOYEE_RELATIONSHIPS.md`
3. Reset test data: Run `create_random_users.sql` again

## Support

For issues or questions:
1. Check the setup guide (`MYSQL_SETUP_GUIDE.md`)
2. Review schema documentation (`DATABASE_SCHEMA.md`)
3. Check Spring Boot logs for connection errors
4. Verify MySQL is running and accessible
5. Review test case documentation for examples

---

**Last Updated**: December 2025
