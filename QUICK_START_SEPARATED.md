# Quick Start Guide - Separated Projects

## 🚀 Quick Start

### Backend (VS Code) - Port 8080

```bash
cd backend-java
mvn spring-boot:run
```

**Or in VS Code:**
- Press `F5` to run
- Or open `PipManagementApplication.java` and click Run

**Verify:** http://localhost:8080/api/health

---

### Frontend (Cursor) - Port 5173

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

**Verify:** http://localhost:5173

---

## 📋 Configuration Summary

### Backend
- **Port**: 8080
- **CORS**: Enabled for `http://localhost:5173`
- **IDE**: VS Code (configured in `.vscode/`)
- **Run**: `mvn spring-boot:run` or from main class

### Frontend
- **Port**: 5173
- **API URL**: Configured via `VITE_API_BASE_URL` (default: `http://localhost:8080`)
- **IDE**: Cursor
- **Run**: `npm run dev`

---

## 📚 Documentation

- **Project Architecture**: See `PROJECT_SEPARATION.md`
- **API Contract**: See `backend-java/API_CONTRACT.md`
- **Frontend Examples**: See `frontend/API_USAGE_EXAMPLES.md`

---

## ✅ What Changed

1. ✅ Backend port: 3001 → 8080
2. ✅ Frontend port: 3000 → 5173
3. ✅ Removed Vite proxy (direct API calls)
4. ✅ Added environment variable support (`VITE_API_BASE_URL`)
5. ✅ Configured CORS for frontend origin
6. ✅ Added VS Code configuration for backend
7. ✅ Removed redundant `@CrossOrigin` annotations
8. ✅ Created comprehensive API documentation

---

## 🔧 Troubleshooting

**Backend won't start:**
- Check Java 17 is installed: `java -version`
- Check port 8080 is free: `lsof -i :8080`

**Frontend can't connect to backend:**
- Verify backend is running on port 8080
- Check `.env.local` has `VITE_API_BASE_URL=http://localhost:8080`
- Restart frontend dev server after changing `.env.local`

**CORS errors:**
- Verify backend CORS allows `http://localhost:5173`
- Check backend is running and accessible

---

## 🎯 Next Steps

1. Start backend in VS Code
2. Start frontend in Cursor
3. Test the integration
4. Begin development!
