# Complete Connection Setup Guide

This guide will help you connect your **Backend**, **Frontend**, and **MySQL Database** together.

## ✅ What's Already Configured

1. ✅ **Database Schema**: Created in MySQL (`pip_management`)
2. ✅ **Backend Configuration**: Updated to use MySQL
3. ✅ **Frontend Configuration**: API endpoint set to `http://localhost:8080`

---

## 🔧 Step 1: Update MySQL Password (If Needed)

The backend is currently configured to connect with:
- **Username**: `root`
- **Password**: (empty - if you set a password during MySQL installation, update it below)

### Update Backend Configuration

Edit `backend-java/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    username: root
    password: YOUR_MYSQL_PASSWORD_HERE  # Update this if you set a password
```

**OR** if you created a dedicated user (as recommended in the MySQL setup guide):

```yaml
spring:
  datasource:
    username: pip_user
    password: your_secure_password_here  # The password you set for pip_user
```

---

## 🚀 Step 2: Start MySQL Server

Make sure MySQL is running:

### macOS (Homebrew):
```bash
brew services start mysql
# OR
mysql.server start
```

### Verify MySQL is Running:
```bash
mysqladmin -u root -p ping
```

---

## 🚀 Step 3: Start the Backend

Open a terminal and run:

```bash
cd /Users/vanshajsharma/PIP
./start-backend.sh
```

**OR** manually:

```bash
cd backend-java
mvn spring-boot:run
```

### Expected Output:
```
✅ Starting backend on http://localhost:8080
...
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
```

### If you see connection errors:
- Check MySQL is running
- Verify database `pip_management` exists
- Check username/password in `application.yml`
- Verify tables exist: `mysql -u root -p -e "USE pip_management; SHOW TABLES;"`

---

## 🚀 Step 4: Start the Frontend

Open a **new terminal** and run:

```bash
cd /Users/vanshajsharma/PIP
./start-frontend.sh
```

**OR** manually:

```bash
cd frontend
npm install  # First time only
npm run dev
```

### Expected Output:
```
✅ Starting frontend on http://localhost:5173
```

The frontend will automatically open in your browser at `http://localhost:5173`

---

## ✅ Step 5: Test the Connection

### 1. **Test Backend → Database Connection**

When the backend starts, check the logs for:
- ✅ `HikariPool-1 - Start completed` (connection successful)
- ❌ `Access denied` (wrong password)
- ❌ `Unknown database` (database doesn't exist)

### 2. **Test Frontend → Backend Connection**

1. Open browser: `http://localhost:5173`
2. You should see the login page
3. Try logging in with sample credentials:
   - **Email**: `admin@pip.com`
   - **Password**: `password123`

### 3. **Verify Database Data**

In MySQL Workbench or terminal:

```sql
USE pip_management;
SELECT * FROM users;
```

You should see 5 sample users.

---

## 🔍 Troubleshooting

### Backend Won't Connect to MySQL

**Error**: `Access denied for user 'root'@'localhost'`

**Solution**:
1. Check MySQL password in `application.yml`
2. Test connection manually:
   ```bash
   mysql -u root -p
   ```
3. If you forgot the password, reset it or create a new user:
   ```sql
   CREATE USER 'pip_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON pip_management.* TO 'pip_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

**Error**: `Unknown database 'pip_management'`

**Solution**:
1. Create the database:
   ```sql
   CREATE DATABASE pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Run the schema SQL again in MySQL Workbench

**Error**: `Table 'users' doesn't exist`

**Solution**:
1. Run the schema SQL file in MySQL Workbench
2. Or change `ddl-auto: validate` to `ddl-auto: update` temporarily in `application.yml`

### Frontend Can't Connect to Backend

**Error**: `Cannot connect to server at http://localhost:8080`

**Solution**:
1. Verify backend is running on port 8080
2. Check `frontend/.env` has: `VITE_API_BASE_URL=http://localhost:8080`
3. Restart frontend after changing `.env`

### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
- Backend CORS is already configured for `http://localhost:5173`
- Make sure frontend runs on port 5173 (default Vite port)

---

## 📋 Quick Checklist

- [ ] MySQL server is running
- [ ] Database `pip_management` exists
- [ ] Tables created (users, pips, goals, etc.)
- [ ] MySQL password updated in `backend-java/src/main/resources/application.yml`
- [ ] Backend starts without errors
- [ ] Frontend `.env` file exists with `VITE_API_BASE_URL=http://localhost:8080`
- [ ] Frontend starts on `http://localhost:5173`
- [ ] Can login with `admin@pip.com` / `password123`

---

## 🎯 Next Steps

Once everything is connected:

1. **Login** with sample credentials
2. **Create a new PIP** to test database writes
3. **Check MySQL Workbench** to see data being saved
4. **Explore the application** features

---

## 📝 Configuration Files Summary

| File | Purpose | Key Settings |
|------|---------|--------------|
| `backend-java/src/main/resources/application.yml` | Backend config | MySQL connection, JPA settings |
| `frontend/.env` | Frontend config | API base URL |
| `frontend/vite.config.ts` | Frontend server | Port 5173 |
| MySQL Workbench | Database | Schema `pip_management` |

---

**Need Help?** Check the logs:
- Backend: Terminal where you ran `./start-backend.sh`
- Frontend: Terminal where you ran `./start-frontend.sh`
- Database: MySQL Workbench → Server Status
