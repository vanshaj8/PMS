# API Contract Documentation

## Base URL
- **Development**: `http://localhost:8080`
- **Production**: Configure via environment variables

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format
All responses are JSON objects. Error responses follow this format:
```json
{
  "error": "Error message"
}
```

---

## Health Check

### GET /api/health
Check if the backend is running.

**Response:**
```json
{
  "status": "ok",
  "service": "PIP Management Backend"
}
```

---

## Authentication Endpoints

### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "department": "Engineering",
    "location": "New York",
    "managerId": "manager-id",
    "hrbpId": "hrbp-id",
    "isActive": true
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials or inactive account

---

### GET /api/auth/me
Get current authenticated user information.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "department": "Engineering",
    "location": "New York",
    "managerId": "manager-id",
    "hrbpId": "hrbp-id",
    "isActive": true
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token

---

## User Management Endpoints

### GET /api/users
Get all users (Admin only).

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee",
      "department": "Engineering",
      "location": "New York",
      "managerId": "manager-id",
      "hrbpId": "hrbp-id",
      "isActive": true
    }
  ]
}
```

---

### GET /api/users/for-pip-creation
Get employees and HRBPs for PIP creation (Manager/Admin only).

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "employees": [
    {
      "id": "employee-id",
      "email": "employee@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "employee",
      "department": "Engineering",
      "location": "New York",
      "isActive": true
    }
  ],
  "hrbps": [
    {
      "id": "hrbp-id",
      "email": "hrbp@example.com",
      "firstName": "HR",
      "lastName": "Manager",
      "role": "hrbp",
      "department": "HR",
      "location": "New York",
      "isActive": true
    }
  ]
}
```

---

### GET /api/users/{id}
Get user by ID.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "department": "Engineering",
    "location": "New York",
    "managerId": "manager-id",
    "hrbpId": "hrbp-id",
    "isActive": true
  }
}
```

---

### POST /api/users
Create a new user (Admin only).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "User",
  "role": "EMPLOYEE",
  "department": "Engineering",
  "location": "New York",
  "managerId": "manager-id",
  "hrbpId": "hrbp-id"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "new-user-id",
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "role": "employee",
    "department": "Engineering",
    "location": "New York",
    "isActive": true
  }
}
```

---

### PUT /api/users/{id}
Update user (Admin only).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "department": "Sales",
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "Updated",
    "lastName": "Name",
    "role": "employee",
    "department": "Sales",
    "isActive": true
  }
}
```

---

## PIP Management Endpoints

### GET /api/pips
Get all PIPs accessible to the current user.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "pips": [
    {
      "id": "pip-id",
      "employeeId": "employee-id",
      "managerId": "manager-id",
      "hrbpId": "hrbp-id",
      "status": "ACTIVE",
      "reason": "Performance issues",
      "goals": [
        {
          "id": "goal-id",
          "title": "Improve code quality",
          "description": "Reduce bugs by 50%",
          "weightage": 30.0,
          "status": "NOT_ACHIEVED",
          "deadline": "2024-12-31"
        }
      ],
      "timeline": {
        "employeeAcknowledgementDeadline": "2024-01-15",
        "pipActiveDuration": 90,
        "employeeSelfReviewDeadline": "2024-04-15",
        "managerFinalReviewDeadline": "2024-04-30",
        "hrbpFinalDecisionDeadline": "2024-05-15"
      },
      "createdAt": "2024-01-01T00:00:00",
      "updatedAt": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### GET /api/pips/{id}
Get a specific PIP by ID.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "pip": {
    "id": "pip-id",
    "employeeId": "employee-id",
    "managerId": "manager-id",
    "hrbpId": "hrbp-id",
    "status": "ACTIVE",
    "reason": "Performance issues",
    "goals": [...],
    "timeline": {...},
    "steps": [...],
    "checkIns": [...],
    "createdAt": "2024-01-01T00:00:00",
    "updatedAt": "2024-01-01T00:00:00"
  }
}
```

**Error Responses:**
- `403 Forbidden`: User doesn't have access to this PIP
- `404 Not Found`: PIP not found

---

### POST /api/pips
Create a new PIP (Manager only).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "employeeId": "employee-id",
  "hrbpId": "hrbp-id",
  "reason": "Performance issues",
  "supportingDocuments": "document-urls",
  "goals": [
    {
      "title": "Improve code quality",
      "description": "Reduce bugs by 50%",
      "weightage": 30.0,
      "expectedOutcome": "Zero critical bugs",
      "targetTimeline": "3 months",
      "deadline": "2024-12-31"
    }
  ],
  "timeline": {
    "employeeAcknowledgementDeadline": "2024-01-15",
    "pipActiveDuration": 90,
    "employeeSelfReviewDeadline": "2024-04-15",
    "managerFinalReviewDeadline": "2024-04-30",
    "hrbpFinalDecisionDeadline": "2024-05-15"
  }
}
```

**Response (201 Created):**
```json
{
  "pip": {
    "id": "new-pip-id",
    "employeeId": "employee-id",
    "managerId": "manager-id",
    "status": "PENDING_EMPLOYEE_ACKNOWLEDGEMENT",
    ...
  }
}
```

---

### POST /api/pips/{id}/acknowledge
Employee acknowledges the PIP (Employee only).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "comments": "I acknowledge this PIP"
}
```

**Response (200 OK):**
```json
{
  "pip": {
    "id": "pip-id",
    "status": "ACTIVE",
    ...
  }
}
```

---

### POST /api/pips/{id}/self-review
Employee submits self-review (Employee only).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "goals": [
    {
      "id": "goal-id",
      "justification": "I have achieved this goal",
      "attachments": "attachment-urls"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "pip": {
    "id": "pip-id",
    "status": "PENDING_MANAGER_REVIEW",
    ...
  }
}
```

---

### POST /api/pips/{id}/manager-review
Manager submits review (Manager only).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "goals": [
    {
      "id": "goal-id",
      "status": "ACHIEVED",
      "managerComments": "Good progress"
    }
  ],
  "comments": "Overall satisfactory performance"
}
```

**Response (200 OK):**
```json
{
  "pip": {
    "id": "pip-id",
    "status": "PENDING_HRBP_DECISION",
    ...
  }
}
```

---

### POST /api/pips/{id}/final-decision
HRBP makes final decision (HRBP only).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "outcome": "SUCCESSFUL",
  "remarks": "Employee has successfully completed the PIP"
}
```

**Response (200 OK):**
```json
{
  "pip": {
    "id": "pip-id",
    "status": "COMPLETED",
    "finalOutcome": "SUCCESSFUL",
    "finalRemarks": "Employee has successfully completed the PIP",
    "locked": true,
    ...
  }
}
```

---

### POST /api/pips/{id}/checkins
Add a check-in to a PIP.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "date": "2024-02-15",
  "notes": "Progress update",
  "attachments": "attachment-urls"
}
```

**Response (201 Created):**
```json
{
  "checkIn": {
    "id": "checkin-id",
    "pipId": "pip-id",
    "date": "2024-02-15",
    "notes": "Progress update",
    "attachments": "attachment-urls",
    "createdAt": "2024-02-15T00:00:00"
  }
}
```

---

## Dashboard Endpoints

### GET /api/dashboard/stats
Get dashboard statistics.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "stats": {
    "totalPIPs": 10,
    "activePIPs": 5,
    "pendingAction": 3,
    "overduePIPs": 1,
    "successRate": 75.5,
    "averageDuration": 85.2
  }
}
```

---

### GET /api/dashboard/pips-by-status
Get PIP count grouped by status.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "byStatus": {
    "active": 5,
    "pending_employee_acknowledgement": 2,
    "pending_manager_review": 1,
    "completed": 2
  }
}
```

---

## Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## User Roles

- `ADMIN`: Full system access
- `MANAGER`: Can create and review PIPs
- `EMPLOYEE`: Can acknowledge and self-review PIPs
- `HRBP`: Can make final decisions on PIPs
- `EXECUTIVE`: Read-only access to all PIPs

---

## PIP Status Values

- `PENDING_EMPLOYEE_ACKNOWLEDGEMENT`
- `ACTIVE`
- `PENDING_MANAGER_REVIEW`
- `PENDING_HRBP_DECISION`
- `COMPLETED`
- `OVERDUE`

---

## Goal Status Values

- `ACHIEVED`
- `PARTIALLY_ACHIEVED`
- `NOT_ACHIEVED`

---

## Final Outcome Values

- `SUCCESSFUL`
- `UNSUCCESSFUL`
- `EXTENDED`
- `CLOSED_WITHOUT_ACTION`
