# Current Status

## ✅ Running Services

The **Java Spring Boot backend** and **React frontend** are configured and ready to run.

### Access the Application:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080

### Default Login:
- **Email:** admin@pip.com
- **Password:** password123

**All test users use password: `password123`**

---

## Current Architecture

### Backend
- **Framework:** Java 17 + Spring Boot 3.2.0
- **Database:** MySQL 8.0+ (pip_management)
- **Port:** 8080
- **Status:** Ready to run

### Frontend
- **Framework:** React + TypeScript + Material-UI
- **Build Tool:** Vite
- **Port:** 5173
- **Status:** Ready to run

### Database
- **Type:** MySQL
- **Name:** pip_management
- **Status:** Schema created, test users available

---

## To Start Services

### Terminal 1 - Backend:
```bash
cd /Users/vanshajsharma/PIP/backend-java
./start-backend.sh
# Or manually:
source ~/.zshrc  # Sets Java 17
mvn spring-boot:run
```

### Terminal 2 - Frontend:
```bash
cd /Users/vanshajsharma/PIP/frontend
npm run dev
```

---

## Default Users

All use password: `password123`

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pip.com | password123 |
| Manager | manager@pip.com | password123 |
| Employee | employee@pip.com | password123 |
| HRBP | hrbp@pip.com | password123 |
| Executive | executive@pip.com | password123 |

### Additional Test Users

30 additional users available:
- 10 Managers
- 10 Employees  
- 10 HRBPs

All use password: `password123`

---

## Database Status

- **Total Users:** 35
- **Managers:** 11
- **Employees:** 11
- **HRBPs:** 11
- **Admins:** 1
- **Executives:** 1

All employees have manager and HRBP assigned for PIP purposes.

---

## Test PIP Available

A test PIP is available for manager review:
- **Status:** PENDING_MANAGER_REVIEW
- **Employee:** Alex Miller
- **Manager:** Sarah Chen (can review)
- **HRBP:** Patricia Martinez

See `backend-java/database/TEST_CASE_MANAGER_REVIEW.md` for details.

---

## Next Steps

1. **Start backend:** `cd backend-java && ./start-backend.sh`
2. **Start frontend:** `cd frontend && npm run dev`
3. **Open browser:** http://localhost:5173
4. **Login** with admin credentials
5. **Start using the application!**

---

**Last Updated:** December 2025
