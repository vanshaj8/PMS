# PIP Management System - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Modern web browser

## Installation

1. **Install root dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
cd backend
npm install
```

3. **Install frontend dependencies:**
```bash
cd frontend
npm install
```

4. **Set up environment variables:**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration (optional, defaults work for development)
```

## Running the Application

### Development Mode

From the root directory:
```bash
npm run dev
```

This will start both backend (port 3001) and frontend (port 3000) servers concurrently.

Or run them separately:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Production Build

```bash
npm run build
```

Backend will be built to `backend/dist/`
Frontend will be built to `frontend/dist/`

## Default Users

The system automatically creates these default users on first run:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pip.com | admin123 |
| Manager | manager@pip.com | manager123 |
| Employee | employee@pip.com | employee123 |
| HRBP | hrbp@pip.com | hrbp123 |
| Executive | executive@pip.com | executive123 |

## Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Features Overview

### Manager Role
- Create PIPs for employees
- Set goals with weightages
- Configure timelines
- Review employee self-reviews
- Submit manager reviews

### Employee Role
- View assigned PIPs
- Acknowledge PIPs
- Submit self-reviews
- Add check-ins during active PIP period

### HRBP Role
- Review and approve/deny PIPs
- Make final decisions
- View all PIPs in their scope

### Admin Role
- Manage users
- Override timelines
- View audit logs
- System configuration

### Executive Role
- Read-only dashboards
- View organization-wide metrics
- Export reports

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### PIPs
- `GET /api/pips` - List PIPs (filtered by role)
- `GET /api/pips/:id` - Get PIP details
- `POST /api/pips` - Create PIP (Manager only)
- `POST /api/pips/:id/acknowledge` - Employee acknowledgement
- `POST /api/pips/:id/hrbp-review` - HRBP review
- `POST /api/pips/:id/self-review` - Employee self-review
- `POST /api/pips/:id/manager-review` - Manager review
- `POST /api/pips/:id/final-decision` - HRBP final decision
- `POST /api/pips/:id/checkins` - Add check-in
- `POST /api/pips/:id/timeline-override` - Override timeline (Admin only)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/pips-by-status` - Get PIPs grouped by status
- `GET /api/dashboard/overdue-pips` - Get overdue PIPs

### Reports
- `GET /api/reports/pip/:id/pdf` - Export PIP as PDF
- `GET /api/reports/pips/csv` - Export all PIPs as CSV
- `GET /api/reports/pips/excel` - Export all PIPs as Excel

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user

### Audit (Admin, HRBP, Executive)
- `GET /api/audit` - Get audit logs

## Data Storage

The system uses JSON files for data storage (in `backend/data/`). This is suitable for development and can be easily migrated to a database like PostgreSQL or MongoDB for production.

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Role-based access control is enforced
- All actions are logged in audit trail

## Troubleshooting

1. **Port already in use:**
   - Change ports in `backend/.env` and `frontend/vite.config.ts`

2. **CORS errors:**
   - Ensure backend CORS is configured correctly
   - Check that frontend proxy settings match backend port

3. **Authentication issues:**
   - Clear browser localStorage
   - Check that JWT_SECRET is set in backend/.env

4. **Data not persisting:**
   - Ensure `backend/data/` directory exists and is writable

## Next Steps

- Configure email notifications (optional)
- Set up file upload handling for attachments
- Migrate to a production database
- Add unit and integration tests
- Set up CI/CD pipeline

