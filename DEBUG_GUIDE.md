# Debugging Guide - Common Issues

## Backend is Running but Getting Errors

If your backend is running on port 8080 but you're still getting errors, follow these steps:

### 1. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for red error messages
- **Network tab**: Check if API calls are failing

### 2. Common Error Types

#### A. CORS Error
**Error Message**: `Access to fetch at 'http://localhost:8080/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solution**:
1. Verify backend CORS configuration allows `http://localhost:5173`
2. Check `SecurityConfig.java` has the correct origin
3. Restart backend after any CORS changes

#### B. Connection Refused
**Error Message**: `Cannot connect to server at http://localhost:8080`

**Solution**:
1. Verify backend is running: `curl http://localhost:8080/api/health`
2. Check frontend `.env.local` has: `VITE_API_BASE_URL=http://localhost:8080`
3. Restart frontend dev server after changing `.env.local`

#### C. 401 Unauthorized
**Error Message**: `401 Unauthorized` or `Invalid token`

**Solution**:
1. Clear localStorage: Open browser console and run:
   ```javascript
   localStorage.clear()
   ```
2. Try logging in again
3. Check if token is being sent in requests (check Network tab)

#### D. 404 Not Found
**Error Message**: `404 Not Found` for API endpoints

**Solution**:
1. Verify endpoint URL is correct (should start with `/api/`)
2. Check backend logs for registered endpoints
3. Verify the endpoint exists in the controller

#### E. 500 Internal Server Error
**Error Message**: `500 Internal Server Error`

**Solution**:
1. Check backend terminal logs for detailed error
2. Check database connection (H2 database file exists)
3. Verify all required environment variables are set

### 3. Quick Diagnostic Commands

**Test Backend Health:**
```bash
curl http://localhost:8080/api/health
```
Expected: `{"status":"ok","service":"PIP Management Backend"}`

**Test CORS:**
```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:8080/api/health
```

**Check Frontend Environment:**
```bash
cd frontend
cat .env.local
```
Should show: `VITE_API_BASE_URL=http://localhost:8080`

**Check What's Running on Ports:**
```bash
# Check backend port
lsof -i :8080

# Check frontend port
lsof -i :5173
```

### 4. Frontend Debugging

**Check API Base URL in Browser Console:**
```javascript
// Open browser console and run:
console.log(import.meta.env.VITE_API_BASE_URL)
```

**Test API Call Manually:**
```javascript
// In browser console:
fetch('http://localhost:8080/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Check Network Requests:**
1. Open DevTools → Network tab
2. Make a request (e.g., try to login)
3. Click on the failed request
4. Check:
   - Request URL (should be `http://localhost:8080/api/...`)
   - Request Headers (should include `Authorization: Bearer ...` if logged in)
   - Response (check status code and error message)

### 5. Backend Debugging

**Check Backend Logs:**
- Look for any exceptions or errors in the terminal running `mvn spring-boot:run`
- Check for database connection issues
- Verify all beans are created successfully

**Enable More Logging:**
In `application.yml`, you can add:
```yaml
logging:
  level:
    com.pip: DEBUG
    org.springframework.web: DEBUG
    org.springframework.security: DEBUG
```

**Check Registered Endpoints:**
When backend starts, Spring Boot logs all registered endpoints. Look for lines like:
```
Mapped "{[/api/health]}" onto ...
```

### 6. Common Fixes

**Frontend Not Connecting:**
1. Restart frontend: `cd frontend && npm run dev`
2. Clear browser cache: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check `.env.local` exists and has correct value

**Backend Issues:**
1. Restart backend: Stop and run `mvn spring-boot:run` again
2. Clean build: `mvn clean install` then `mvn spring-boot:run`
3. Check database: Delete `./data/pipdb.*` files to reset (WARNING: deletes data)

**CORS Issues:**
1. Verify `SecurityConfig.java` has:
   ```java
   configuration.setAllowedOrigins(List.of("http://localhost:5173"));
   ```
2. Restart backend after CORS changes
3. Clear browser cache

### 7. Still Having Issues?

**Provide this information:**
1. Exact error message (copy from browser console)
2. Backend logs (from terminal)
3. Network request details (from DevTools Network tab)
4. Steps to reproduce the error

**Check these files:**
- `frontend/.env.local` - API base URL
- `backend-java/src/main/resources/application.yml` - Backend config
- `backend-java/src/main/java/com/pip/security/SecurityConfig.java` - CORS config
