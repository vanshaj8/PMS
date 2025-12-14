# Project Separation Guide

This document describes the architecture and setup for the separated frontend and backend projects.

## Architecture Overview

```
┌─────────────────┐         HTTP/REST         ┌─────────────────┐
│                 │ ◄──────────────────────► │                 │
│   Frontend      │      (JSON over HTTP)     │    Backend      │
│   (React/Vite)  │                           │  (Spring Boot)  │
│   Port: 5173    │                           │   Port: 8080     │
│   Cursor IDE    │                           │   VS Code IDE   │
└─────────────────┘                           └─────────────────┘
```

## Project Structure

```
PIP/
├── backend-java/          # Spring Boot Backend (VS Code)
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   │           └── application.yml
│   ├── pom.xml
│   ├── .vscode/           # VS Code configuration
│   └── API_CONTRACT.md    # API documentation
│
└── frontend/              # React Frontend (Cursor)
    ├── src/
    │   ├── services/
    │   │   └── api.ts     # API client configuration
    │   └── ...
    ├── vite.config.ts
    ├── .env.example       # Environment variable template
    ├── .env.local         # Local environment variables
    └── API_USAGE_EXAMPLES.md
```

---

## Backend Setup (VS Code)

### Prerequisites
- Java 17+
- Maven 3.6+
- VS Code with Java Extension Pack

### Running the Backend

1. **Open in VS Code**
   ```bash
   cd backend-java
   code .
   ```

2. **Install VS Code Extensions**
   - Java Extension Pack (Microsoft)
   - Spring Boot Extension Pack (VMware)

3. **Run the Application**
   
   **Option 1: Using Maven**
   ```bash
   mvn spring-boot:run
   ```
   
   **Option 2: From VS Code**
   - Press `F5` or use Run → Start Debugging
   - Select "Launch PipManagementApplication" configuration
   
   **Option 3: From Main Class**
   - Open `src/main/java/com/pip/PipManagementApplication.java`
   - Click "Run" button or press `Ctrl+F5`

4. **Verify Backend is Running**
   - Open: http://localhost:8080/api/health
   - Should return: `{"status":"ok","service":"PIP Management Backend"}`

### Backend Configuration

- **Port**: 8080 (configured in `application.yml`)
- **CORS**: Enabled for `http://localhost:5173`
- **Database**: H2 (file-based, stored in `./data/pipdb`)
- **JWT**: Configured for authentication

### Backend Endpoints

All endpoints are prefixed with `/api`:
- `/api/health` - Health check
- `/api/auth/*` - Authentication
- `/api/users/*` - User management
- `/api/pips/*` - PIP management
- `/api/dashboard/*` - Dashboard data

See `backend-java/API_CONTRACT.md` for complete API documentation.

---

## Frontend Setup (Cursor)

### Prerequisites
- Node.js 18+
- npm or yarn

### Running the Frontend

1. **Open in Cursor**
   ```bash
   cd frontend
   cursor .
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   Copy the example file:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Verify Frontend is Running**
   - Open: http://localhost:5173
   - Should see the application interface

### Frontend Configuration

- **Port**: 5173 (Vite default, configured in `vite.config.ts`)
- **API Base URL**: Configurable via `VITE_API_BASE_URL` environment variable
- **Proxy**: Removed (direct API calls to backend)

### Frontend API Client

The API client is configured in `src/services/api.ts`:
- Automatically uses `VITE_API_BASE_URL` from environment
- Adds JWT token from localStorage to all requests
- Handles 401 errors by redirecting to login

See `frontend/API_USAGE_EXAMPLES.md` for usage examples.

---

## Communication Between Frontend and Backend

### CORS Configuration

The backend is configured to accept requests from the frontend:

**Backend (`SecurityConfig.java`):**
```java
configuration.setAllowedOrigins(List.of("http://localhost:5173"));
configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
configuration.setAllowedHeaders(Arrays.asList("*"));
configuration.setAllowCredentials(true);
```

### Making API Calls

**Frontend Example:**
```typescript
import api from './services/api';

// GET request
const response = await api.get('/pips');
const pips = response.data.pips;

// POST request
const newPIP = await api.post('/pips', {
  employeeId: '...',
  // ... other data
});
```

The `api` instance automatically:
- Prepends the base URL from `VITE_API_BASE_URL`
- Adds `/api` prefix
- Includes JWT token in Authorization header
- Handles errors

---

## Development Workflow

### Starting Both Projects

**Terminal 1 - Backend:**
```bash
cd backend-java
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Testing the Integration

1. **Backend Health Check**
   ```bash
   curl http://localhost:8080/api/health
   ```

2. **Frontend API Call**
   - Open browser console on http://localhost:5173
   - The frontend should successfully call backend APIs

3. **Check Network Tab**
   - Open browser DevTools → Network
   - Verify requests are going to `http://localhost:8080/api/*`

---

## Environment Variables

### Backend

Configured in `application.yml`:
- `server.port`: 8080
- `cors.allowed-origins`: http://localhost:5173
- Database, JWT, etc.

### Frontend

Configured via `.env.local`:
- `VITE_API_BASE_URL`: http://localhost:8080

**Important**: 
- Vite requires `VITE_` prefix for environment variables
- Variables are accessed via `import.meta.env.VITE_API_BASE_URL`
- `.env.local` is git-ignored (use `.env.example` as template)

---

## Production Deployment

### Backend
- Update `application.yml` for production database
- Set CORS allowed origins to production frontend URL
- Configure JWT secret securely
- Build: `mvn clean package`
- Run: `java -jar target/pip-management-backend-1.0.0.jar`

### Frontend
- Set `VITE_API_BASE_URL` to production backend URL
- Build: `npm run build`
- Deploy `dist/` folder to web server

---

## Troubleshooting

### Backend Issues

**Port Already in Use:**
```bash
# Find process using port 8080
lsof -i :8080
# Kill the process
kill -9 <PID>
```

**Maven Dependencies:**
```bash
mvn clean install
```

**Database Issues:**
- Delete `./data/pipdb.*` files to reset database
- Restart backend to recreate schema

### Frontend Issues

**Cannot Connect to Backend:**
- Verify backend is running on port 8080
- Check `VITE_API_BASE_URL` in `.env.local`
- Verify CORS configuration in backend

**Environment Variables Not Working:**
- Ensure variable name starts with `VITE_`
- Restart dev server after changing `.env.local`
- Check `import.meta.env.VITE_API_BASE_URL` in console

**CORS Errors:**
- Verify backend CORS allows `http://localhost:5173`
- Check browser console for specific CORS error
- Ensure backend is running

---

## Key Differences from Previous Setup

1. **Ports Changed**
   - Backend: 3001 → 8080
   - Frontend: 3000 → 5173

2. **No Proxy**
   - Removed Vite proxy configuration
   - Direct API calls using environment variable

3. **CORS Enabled**
   - Backend explicitly allows frontend origin
   - Removed `@CrossOrigin` annotations (handled globally)

4. **Environment Variables**
   - Frontend uses `.env.local` for API base URL
   - Backend uses `application.yml` for configuration

5. **IDE Separation**
   - Backend optimized for VS Code
   - Frontend optimized for Cursor

---

## Next Steps

1. **Backend Development (VS Code)**
   - Add new API endpoints
   - Update `API_CONTRACT.md` with new endpoints
   - Test with Postman or curl

2. **Frontend Development (Cursor)**
   - Consume new APIs
   - Update `API_USAGE_EXAMPLES.md` with examples
   - Test in browser

3. **Integration Testing**
   - Test complete user flows
   - Verify CORS works correctly
   - Test error handling

---

## Support

- Backend API Documentation: `backend-java/API_CONTRACT.md`
- Frontend API Examples: `frontend/API_USAGE_EXAMPLES.md`
- This Guide: `PROJECT_SEPARATION.md`
