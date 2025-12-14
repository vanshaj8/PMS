# Performance Improvement Plan (PIP) Management System

A comprehensive Performance Improvement Plan management system with multi-role support, workflow automation, timeline management, and advanced reporting.

## Features

### User Roles
- **Manager (Reviewer)**: Create and manage PIPs
- **Employee**: Review, acknowledge, and complete self-reviews
- **HRBP**: Review and make final decisions on PIPs
- **Admin / Super Admin**: Full system administration
- **Executive**: Read-only dashboards and analytics

### Core Workflow
1. Manager initiates PIP with goals and timelines
2. HRBP reviews and approves/denies/sends back
3. Employee reviews and acknowledges
4. Active PIP period with check-ins
5. Employee self-review
6. Manager final review
7. HRBP final decision

### Key Features
- Timeline management with admin override capabilities
- Role-specific dashboards
- Comprehensive reporting (PDF, CSV, Excel)
- Audit logging and digital signatures
- Goal library and PIP templates
- Multi-manager support
- Advanced search and filtering

## Tech Stack

- **Frontend**: React + TypeScript + Material-UI + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: JSON-based (easily migratable to PostgreSQL/MongoDB)
- **Authentication**: JWT

## Setup

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

3. Run development servers:
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Project Structure

```
PIP/
├── backend/          # Express API server
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── models/   # Data models
│   │   ├── middleware/ # Auth, validation
│   │   ├── services/ # Business logic
│   │   └── utils/    # Utilities
│   └── data/         # JSON database files
├── frontend/         # React application
│   └── src/
│       ├── components/ # React components
│       ├── pages/     # Page components
│       ├── services/  # API services
│       ├── store/     # State management
│       └── utils/     # Utilities
└── shared/           # Shared TypeScript types
```

## Default Users

After first run, default users are created:
- Admin: admin@pip.com / admin123
- Manager: manager@pip.com / manager123
- Employee: employee@pip.com / employee123
- HRBP: hrbp@pip.com / hrbp123

## License

ISC

# PMS
