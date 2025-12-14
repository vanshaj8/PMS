# MySQL Database Setup for PIP Management System

## Quick Start

1. **Install MySQL** (if not already installed)
   - See `MYSQL_SETUP_GUIDE.md` for detailed instructions

2. **Create Database and User**
   ```sql
   CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'pip_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON pip_management.* TO 'pip_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Run Schema**
   ```bash
   mysql -u pip_user -p pip_management < schema.sql
   ```

4. **Load Sample Data (Optional)**
   ```bash
   mysql -u pip_user -p pip_management < sample_data.sql
   ```

5. **Configure Spring Boot**
   - Copy `application-mysql.yml` configuration
   - Update database credentials
   - Set active profile to `mysql`

6. **Start Application**
   ```bash
   mvn spring-boot:run -Dspring.profiles.active=mysql
   ```

## Files in This Directory

- **schema.sql** - Complete database schema with all tables, indexes, and foreign keys
- **sample_data.sql** - Sample data for testing and development
- **DATABASE_SCHEMA.md** - Detailed documentation of all tables and relationships
- **MYSQL_SETUP_GUIDE.md** - Step-by-step setup instructions
- **repository-examples.md** - Spring Data JPA repository examples
- **entity-examples.md** - JPA entity mapping examples

## Database Structure

### Core Tables
- `users` - User accounts and authentication
- `pips` - Performance Improvement Plans
- `goals` - Individual goals within PIPs
- `pip_steps` - Workflow step tracking
- `check_ins` - Progress check-ins

### Supporting Tables
- `audit_logs` - System audit trail
- `notifications` - User notifications
- `timeline_overrides` - Admin timeline changes
- `goal_library` - Reusable goal templates (optional)
- `pip_templates` - Reusable PIP templates (optional)

## Configuration Files

### Spring Boot Configuration

**application-mysql.yml** - MySQL database configuration with:
- Connection string
- HikariCP connection pool settings
- JPA/Hibernate configuration
- Logging settings

**application.properties.mysql** - Alternative properties format

## Key Features

- ✅ Normalized database design
- ✅ Proper indexes for performance
- ✅ Foreign key constraints for data integrity
- ✅ Audit logging support
- ✅ Optimistic locking with version field
- ✅ UTF8MB4 character set for full Unicode support
- ✅ Production-ready configuration

## Documentation

For detailed information, see:
- **DATABASE_SCHEMA.md** - Complete schema documentation
- **MYSQL_SETUP_GUIDE.md** - Setup and troubleshooting
- **repository-examples.md** - Repository usage examples
- **entity-examples.md** - Entity mapping examples

## Support

For issues or questions:
1. Check `MYSQL_SETUP_GUIDE.md` troubleshooting section
2. Verify MySQL is running and accessible
3. Check Spring Boot logs for connection errors
4. Test connection manually: `mysql -u pip_user -p pip_management`
