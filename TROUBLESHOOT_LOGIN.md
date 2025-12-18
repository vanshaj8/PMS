# Troubleshooting Login Error

## ✅ Backend Status
- Backend is running: ✅ Yes (http://localhost:8080)
- Backend API works: ✅ Yes (tested with curl)
- Password hash updated: ✅ Yes

## Current Login Credentials

**Email:** `admin@pip.com`  
**Password:** `password123`

(All users use the same password: `password123`)

## Steps to Troubleshoot

### 1. Check Browser Console
1. Open http://localhost:5173
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the **Console** tab
4. Try logging in
5. Look for any error messages

### 2. Check Network Tab
1. In Developer Tools, go to **Network** tab
2. Try logging in
3. Find the `/api/auth/login` request
4. Check:
   - Request URL (should be `http://localhost:8080/api/auth/login`)
   - Request Payload (should have email and password)
   - Response Status (should be 200)
   - Response Body (should have token and user)

### 3. Verify Credentials
Make sure you're typing:
- Email: `admin@pip.com` (exactly, no spaces)
- Password: `password123` (all lowercase, no spaces)

### 4. Clear Browser Cache
1. Clear localStorage:
   - Open Console
   - Type: `localStorage.clear()`
   - Press Enter
   - Refresh page
2. Or use Incognito/Private window

### 5. Check Backend Logs
The backend is running. Check if you see login attempts in the logs.

### 6. Test with curl
Try this command to verify backend works:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pip.com","password":"password123"}'
```

This should return a JSON with `token` and `user` fields.

## Common Issues

### Issue: "Invalid email or password"
**Cause:** Password hash mismatch or wrong credentials
**Solution:** ✅ Already fixed - passwords updated in database

### Issue: "Cannot connect to server"
**Cause:** Backend not running or wrong URL
**Solution:** 
- Verify backend is running: `curl http://localhost:8080/api/health`
- Check frontend `.env` has: `VITE_API_BASE_URL=http://localhost:8080`

### Issue: CORS Error
**Cause:** Backend not allowing frontend origin
**Solution:** ✅ Already configured - CORS allows localhost:5173

### Issue: Network Error
**Cause:** Frontend can't reach backend
**Solution:** Check both are running on correct ports

## Still Not Working?

Please provide:
1. Exact error message from browser console
2. Network request details (status code, response body)
3. Any console errors
