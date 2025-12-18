# 🔧 FIX LOGIN NOW - Step by Step

## Current Issue
Getting 401 Unauthorized when trying to login via frontend.

## ✅ Solution - Do This Now:

### Step 1: Make sure backend is running

Open a terminal and run:
```bash
cd /Users/vanshajsharma/PIP/backend-java
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
mvn spring-boot:run
```

Wait until you see: `Started PipManagementApplication`

### Step 2: Test login directly

In a NEW terminal, test if backend login works:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pip.com","password":"password123"}'
```

If this returns a JSON with `token` and `user`, backend is working!

### Step 3: Clear browser cache and try again

1. Open browser to http://localhost:5173
2. Open Developer Tools (F12)
3. In Console, type: `localStorage.clear()` and press Enter
4. Refresh page (Cmd+Shift+R)
5. Try login with:
   - Email: `admin@pip.com`
   - Password: `password123`

### Step 4: Check what's happening

If still getting 401:
1. Open Network tab in DevTools
2. Try login
3. Click on `/api/auth/login` request
4. Check:
   - Request Payload (should show email and password)
   - Response (will show error message)
   - Status Code (401)

## Credentials to Use:

**All users use:** `password123`

- admin@pip.com / password123
- manager@pip.com / password123  
- employee@pip.com / password123
- hrbp@pip.com / password123
- executive@pip.com / password123

## If Still Not Working:

Share:
1. The exact error message from Network tab response
2. The Request Payload from Network tab
3. Whether the curl command in Step 2 worked
