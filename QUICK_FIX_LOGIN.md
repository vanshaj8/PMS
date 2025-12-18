# Quick Fix for Login Issue

## The Problem
You're getting "Invalid email or password" error even though the backend API works.

## Solution Steps

### Step 1: Verify Backend is Running
```bash
curl http://localhost:8080/api/health
```
Should return: `{"service":"PIP Management System","status":"ok"}`

### Step 2: Try These Exact Credentials

**Email:** `admin@pip.com`  
**Password:** `password123`

Make sure:
- No extra spaces before or after
- Email is all lowercase
- Password is all lowercase, no capital letters

### Step 3: Clear Browser Data

1. Open Developer Tools (F12)
2. Go to Console tab
3. Type: `localStorage.clear()` and press Enter
4. Refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
5. Try logging in again

### Step 4: Check Browser Console

1. Open Developer Tools (F12)
2. Go to Console tab  
3. Try to login
4. Look for any error messages
5. Share the error message you see

### Step 5: Check Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to login
4. Click on the `/api/auth/login` request
5. Check:
   - **Request Payload** - should show: `{"email":"admin@pip.com","password":"password123"}`
   - **Response** - should show either success with token OR error message
   - **Status Code** - should be 200 (success) or 401 (error)

### Step 6: Test Backend Directly

Open a new terminal and run:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pip.com","password":"password123"}'
```

This should return a JSON with `token` and `user` fields if backend works.

## What to Share

If it's still not working, please share:
1. Exact error message from browser console
2. Network request details (status code, request payload, response)
3. Any console errors
