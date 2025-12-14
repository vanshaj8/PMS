# MySQL Database Setup for PIP Management System

This directory contains all MySQL database-related files and documentation.

## Files in this Directory

- **schema.sql** - Complete MySQL schema with CREATE TABLE statements
- **DATABASE_SCHEMA.md** - Detailed schema documentation
- **MYSQL_SETUP_GUIDE.md** - Step-by-step setup instructions
- **REPOSITORY_EXAMPLES.md** - Spring Data JPA repository examples
- **ENTITY_MAPPING_EXAMPLES.md** - JPA entity mapping examples
- **README.md** - This file

## Quick Start

1. **Install MySQL** (if not already installed)
   ```bash
   # macOS
   brew install mysql
   
   # Linux
   sudo apt install mysql-server
   ```

2. **Create Database and User**
   ```sql
   CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'pip_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON pip_management.* TO 'pip_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Create Tables**
   ```bash
   mysql -u pip_user -p pip_management < schema.sql
   ```

4. **Configure Spring Boot**
   - Copy `application-mysql.yml` to `application.yml`
   - Update database credentials
   - Set `spring.jpa.hibernate.ddl-auto=validate`

5. **Start Application**
   ```bash
   mvn spring-boot:run
   ```

## Documentation

- **Setup Guide**: See `MYSQL_SETUP_GUIDE.md` for detailed setup instructions
- **Schema Documentation**: See `DATABASE_SCHEMA.md` for table descriptions
- **Repository Examples**: See `REPOSITORY_EXAMPLES.md` for query examples
- **Entity Mapping**: See `ENTITY_MAPPING_EXAMPLES.md` for JPA annotations

## Configuration Files

Configuration examples are in:
- `src/main/resources/application-mysql.yml` - YAML format
- `src/main/resources/application.properties.mysql` - Properties format

## Support

For issues or questions:
1. Check the setup guide
2. Review schema documentation
3. Check Spring Boot logs for connection errors
4. Verify MySQL is running and accessible

---

*Last Updated: 2024*
