# Troubleshooting Guide

## Issue: "Cannot connect to server. Please ensure the backend is running on port 3001"

### ✅ Fixed!

The error message has been updated to use the correct port (8080) and will now show the actual API base URL from your environment configuration.

### Steps to Resolve:

1. **Restart the Frontend Dev Server**
   ```bash
   # Stop the current dev server (Ctrl+C)
   # Then restart it
   cd frontend
   npm run dev
   ```
   
   **Important**: Vite needs to be restarted to pick up:
   - Changes to `.env.local` file
   - Code changes in `src/` directory

2. **Verify Environment Variable**
   
   Check that `.env.local` exists and has the correct value:
   ```bash
   cd frontend
   cat .env.local
   ```
   
   Should show:
   ```
   VITE_API_BASE_URL=http://localhost:8080
   ```
   
   If the file doesn't exist or is incorrect:
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local if needed
   ```

3. **Verify Backend is Running**
   
   Check if backend is running on port 8080:
   ```bash
   curl http://localhost:8080/api/health
   ```
   
   Should return:
   ```json
   {"status":"ok","service":"PIP Management Backend"}
   ```
   
   If not running, start it:
   ```bash
   cd backend-java
   mvn spring-boot:run
   ```

4. **Clear Browser Cache**
   
   Sometimes cached JavaScript can cause issues:
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache completely

5. **Check Browser Console**
   
   Open browser DevTools (F12) and check:
   - Console tab for any errors
   - Network tab to see if requests are going to the correct URL

### Expected Behavior After Fix:

- Error messages will now show: `Cannot connect to server at http://localhost:8080. Please ensure the backend is running.`
- API calls will go to `http://localhost:8080/api/*`
- Frontend runs on `http://localhost:5173`

### Common Issues:

**Issue**: Environment variable not working
- **Solution**: Ensure variable name starts with `VITE_` prefix
- Restart dev server after changing `.env.local`

**Issue**: Backend not accessible
- **Solution**: Check backend logs for errors
- Verify port 8080 is not in use: `lsof -i :8080`
- Check firewall settings

**Issue**: CORS errors
- **Solution**: Verify backend CORS allows `http://localhost:5173`
- Check `SecurityConfig.java` in backend

---

## Quick Verification Checklist

- [ ] Backend is running on port 8080
- [ ] Frontend `.env.local` has `VITE_API_BASE_URL=http://localhost:8080`
- [ ] Frontend dev server has been restarted
- [ ] Browser cache cleared
- [ ] No errors in browser console
- [ ] Network requests show correct URL in DevTools

---

## Still Having Issues?

1. Check the main documentation:
   - `PROJECT_SEPARATION.md` - Architecture overview
   - `QUICK_START_SEPARATED.md` - Quick start guide

2. Verify both projects are running:
   ```bash
   # Terminal 1 - Backend
   cd backend-java
   mvn spring-boot:run
   
   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

3. Test backend directly:
   ```bash
   curl http://localhost:8080/api/health
   ```

4. Check logs:
   - Backend: Check terminal running `mvn spring-boot:run`
   - Frontend: Check browser console and terminal running `npm run dev`
