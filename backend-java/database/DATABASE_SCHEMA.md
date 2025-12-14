# MySQL Database Schema Documentation

## Overview

This document describes the MySQL database schema for the PIP Management System. The schema is designed to be normalized, secure, and production-ready.

---

## Database Information

- **Database Name**: `pip_management`
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- **Engine**: `InnoDB`

---

## Table Relationships

```
users (self-referencing)
  ├── manager_id → users.id
  └── hrbp_id → users.id

pips
  ├── employee_id → users.id
  ├── manager_id → users.id
  └── hrbp_id → users.id

goals
  └── pip_id → pips.id (CASCADE DELETE)

pip_steps
  ├── pip_id → pips.id (CASCADE DELETE)
  └── signed_by → users.id

check_ins
  └── pip_id → pips.id (CASCADE DELETE)

audit_logs
  └── user_id → users.id
```

---

## Table Descriptions

### 1. users

**Purpose**: Stores all user accounts including employees, managers, HRBPs, administrators, and executives.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | CHAR(36) | Unique identifier (UUID) | PRIMARY KEY |
| email | VARCHAR(255) | User's email address | NOT NULL, UNIQUE |
| password | VARCHAR(255) | Hashed password (bcrypt) | NOT NULL |
| first_name | VARCHAR(100) | User's first name | NOT NULL |
| last_name | VARCHAR(100) | User's last name | NOT NULL |
| role | ENUM | User role: ADMIN, MANAGER, EMPLOYEE, HRBP, EXECUTIVE | NOT NULL |
| department | VARCHAR(100) | User's department | NULL |
| location | VARCHAR(100) | User's location | NULL |
| manager_id | CHAR(36) | Reference to user's manager | FOREIGN KEY → users.id |
| hrbp_id | CHAR(36) | Reference to user's HRBP | FOREIGN KEY → users.id |
| is_active | BOOLEAN | Whether account is active | DEFAULT TRUE |
| created_at | TIMESTAMP | Account creation timestamp | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | Last update timestamp | AUTO UPDATE |

**Indexes**:
- `idx_email` - Fast email lookups
- `idx_role` - Filter by role
- `idx_manager_id` - Find direct reports
- `idx_hrbp_id` - Find HRBP assignments
- `idx_is_active` - Filter active users
- `idx_department` - Filter by department

**Relationships**:
- Self-referencing: `manager_id` and `hrbp_id` reference other users
- Referenced by: `pips` (employee_id, manager_id, hrbp_id), `pip_steps` (signed_by)

---

### 2. pips

**Purpose**: Stores Performance Improvement Plans with all associated metadata and timeline information.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | CHAR(36) | Unique identifier (UUID) | PRIMARY KEY |
| employee_id | CHAR(36) | Employee on PIP | NOT NULL, FK → users.id |
| manager_id | CHAR(36) | Manager creating PIP | NOT NULL, FK → users.id |
| hrbp_id | CHAR(36) | HRBP reviewing PIP | NOT NULL, FK → users.id |
| reason | TEXT | Reason for PIP creation | NULL |
| supporting_documents | TEXT | JSON array of document URLs | NULL |
| status | ENUM | Current PIP status | NOT NULL, DEFAULT 'DRAFT' |
| final_outcome | ENUM | Final decision: SUCCESSFUL, UNSUCCESSFUL, EXTENDED, CLOSED_WITHOUT_ACTION | NULL |
| final_remarks | TEXT | HRBP final comments | NULL |
| locked | BOOLEAN | Whether PIP can be modified | DEFAULT FALSE |
| version | INT | Optimistic locking version | DEFAULT 1 |
| employee_acknowledgement_deadline | DATE | Deadline for employee acknowledgement | NULL |
| pip_active_duration | INT | Active PIP duration in days | NULL |
| employee_self_review_deadline | DATE | Deadline for self-review | NULL |
| manager_final_review_deadline | DATE | Deadline for manager review | NULL |
| hrbp_final_decision_deadline | DATE | Deadline for HRBP decision | NULL |
| grace_period | INT | Grace period in days | NULL |
| created_at | TIMESTAMP | PIP creation timestamp | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | Last update timestamp | AUTO UPDATE |

**Status Values**:
- `DRAFT` - Being created by manager
- `PENDING_HRBP_REVIEW` - Awaiting HRBP initial review
- `PENDING_EMPLOYEE_ACKNOWLEDGEMENT` - Awaiting employee acknowledgement
- `ACTIVE` - PIP is active, improvement period ongoing
- `PENDING_EMPLOYEE_SELF_REVIEW` - Awaiting employee self-review
- `PENDING_MANAGER_REVIEW` - Awaiting manager final review
- `PENDING_HRBP_DECISION` - Awaiting HRBP final decision
- `COMPLETED` - PIP process completed
- `OVERDUE` - Past deadline
- `CANCELLED` - PIP cancelled

**Indexes**:
- `idx_employee_id` - Find all PIPs for an employee
- `idx_manager_id` - Find all PIPs created by a manager
- `idx_hrbp_id` - Find all PIPs assigned to an HRBP
- `idx_status` - Filter by status
- `idx_created_at` - Sort by creation date
- `idx_final_outcome` - Filter by outcome

**Relationships**:
- References: `users` (employee_id, manager_id, hrbp_id)
- Referenced by: `goals`, `pip_steps`, `check_ins`

---

### 3. goals

**Purpose**: Stores individual improvement goals within a PIP.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | CHAR(36) | Unique identifier (UUID) | PRIMARY KEY |
| pip_id | CHAR(36) | Parent PIP | NOT NULL, FK → pips.id |
| title | VARCHAR(255) | Goal title | NOT NULL |
| description | TEXT | Detailed goal description | NULL |
| weightage | DECIMAL(5,2) | Goal importance (0-100%) | NOT NULL, CHECK 0-100 |
| expected_outcome | TEXT | What success looks like | NULL |
| target_timeline | VARCHAR(100) | Target completion timeline | NULL |
| deadline | DATE | Specific deadline date | NULL |
| justification | TEXT | Employee's justification | NULL |
| employee_attachments | TEXT | JSON array of attachments | NULL |
| status | ENUM | Goal status: ACHIEVED, PARTIALLY_ACHIEVED, NOT_ACHIEVED | DEFAULT 'NOT_ACHIEVED' |
| manager_comments | TEXT | Manager's assessment comments | NULL |
| created_at | TIMESTAMP | Creation timestamp | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | Last update timestamp | AUTO UPDATE |

**Indexes**:
- `idx_pip_id` - Find all goals for a PIP
- `idx_status` - Filter by achievement status

**Relationships**:
- References: `pips` (pip_id) - CASCADE DELETE

**Constraints**:
- Weightage must be between 0 and 100
- Total weightage for all goals in a PIP should ideally sum to 100% (enforced in application logic)

---

### 4. pip_steps

**Purpose**: Tracks workflow steps and their completion status for each PIP.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | CHAR(36) | Unique identifier (UUID) | PRIMARY KEY |
| pip_id | CHAR(36) | Parent PIP | NOT NULL, FK → pips.id |
| step | ENUM | Step type | NOT NULL |
| status | ENUM | Step status: PENDING, DUE_SOON, OVERDUE, COMPLETED | NOT NULL, DEFAULT 'PENDING' |
| due_date | DATE | Step due date | NOT NULL |
| completed_date | DATE | When step was completed | NULL |
| comments | TEXT | Step comments | NULL |
| signed_by | CHAR(36) | User who completed step | FK → users.id |
| created_at | TIMESTAMP | Creation timestamp | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | Last update timestamp | AUTO UPDATE |

**Step Types**:
- `EMPLOYEE_ACKNOWLEDGEMENT` - Employee must acknowledge PIP
- `ACTIVE_PIP` - PIP is active
- `EMPLOYEE_SELF_REVIEW` - Employee self-review
- `MANAGER_REVIEW` - Manager final review
- `HRBP_REVIEW` - HRBP initial review
- `HRBP_DECISION` - HRBP final decision

**Indexes**:
- `idx_pip_id` - Find all steps for a PIP
- `idx_step` - Filter by step type
- `idx_status` - Filter by status
- `idx_due_date` - Find overdue steps
- `idx_signed_by` - Find steps signed by user

**Relationships**:
- References: `pips` (pip_id) - CASCADE DELETE, `users` (signed_by)

**Constraints**:
- Unique constraint: One step type per PIP (`uk_pip_step`)

---

### 5. check_ins

**Purpose**: Stores progress check-ins during the active PIP period.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | CHAR(36) | Unique identifier (UUID) | PRIMARY KEY |
| pip_id | CHAR(36) | Parent PIP | NOT NULL, FK → pips.id |
| date | DATE | Check-in date | NOT NULL |
| notes | TEXT | Check-in notes | NULL |
| attachments | TEXT | JSON array of attachments | NULL |
| created_at | TIMESTAMP | Creation timestamp | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | Last update timestamp | AUTO UPDATE |

**Indexes**:
- `idx_pip_id` - Find all check-ins for a PIP
- `idx_date` - Sort by date
- `idx_created_at` - Sort by creation time

**Relationships**:
- References: `pips` (pip_id) - CASCADE DELETE

---

### 6. audit_logs (Optional)

**Purpose**: Tracks all changes to entities for audit and compliance.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | BIGINT | Auto-increment ID | PRIMARY KEY |
| entity_type | VARCHAR(50) | Type of entity (PIP, GOAL, USER) | NOT NULL |
| entity_id | CHAR(36) | ID of the entity | NOT NULL |
| action | VARCHAR(50) | Action taken (CREATE, UPDATE, DELETE) | NOT NULL |
| user_id | CHAR(36) | User who performed action | FK → users.id |
| old_values | JSON | Previous values | NULL |
| new_values | JSON | New values | NULL |
| ip_address | VARCHAR(45) | User's IP address | NULL |
| user_agent | TEXT | Browser/client information | NULL |
| created_at | TIMESTAMP | Action timestamp | DEFAULT CURRENT_TIMESTAMP |

**Indexes**:
- `idx_entity` - Find all changes to an entity
- `idx_user_id` - Find all actions by a user
- `idx_created_at` - Sort by time
- `idx_action` - Filter by action type

**Relationships**:
- References: `users` (user_id)

---

## Data Types Explanation

### CHAR(36) vs VARCHAR(36)
- **CHAR(36)**: Used for UUIDs - fixed length, faster for exact matches
- **VARCHAR**: Variable length, used for text fields

### ENUM Types
- Used for fixed sets of values (status, roles, etc.)
- Provides data integrity at database level
- More efficient than VARCHAR for small sets

### TEXT vs VARCHAR
- **VARCHAR(255)**: For short text (names, titles)
- **TEXT**: For longer content (descriptions, comments, JSON)

### TIMESTAMP
- Automatically handles timezone conversion
- `DEFAULT CURRENT_TIMESTAMP` - sets on insert
- `ON UPDATE CURRENT_TIMESTAMP` - updates on modification

---

## Indexes Strategy

### Primary Indexes
- All tables have primary key on `id`

### Foreign Key Indexes
- All foreign keys are indexed for join performance

### Query Optimization Indexes
- Status fields (frequently filtered)
- Date fields (for sorting and range queries)
- Email (for login lookups)
- Role (for authorization queries)

---

## Security Considerations

1. **Password Storage**: Passwords are hashed using bcrypt (stored in `password` column)
2. **SQL Injection**: Use parameterized queries (handled by JPA/Hibernate)
3. **Access Control**: Enforced at application level based on `role` field
4. **Audit Trail**: `audit_logs` table tracks all changes
5. **Soft Deletes**: Consider adding `deleted_at` column for soft deletes (optional)

---

## Performance Optimization

1. **Indexes**: Strategic indexes on frequently queried columns
2. **Partitioning**: Consider partitioning `audit_logs` by date for large datasets
3. **Connection Pooling**: Configure HikariCP for optimal connection management
4. **Query Optimization**: Use EXPLAIN to analyze query performance

---

## Migration Strategy

1. **Development**: Use `spring.jpa.hibernate.ddl-auto=update` for development
2. **Production**: Use Flyway or Liquibase for version-controlled migrations
3. **Backup**: Always backup before schema changes
4. **Testing**: Test migrations on staging environment first

---

## Sample Queries

### Find all active PIPs for an employee
```sql
SELECT * FROM pips 
WHERE employee_id = ? AND status = 'ACTIVE';
```

### Find overdue PIPs
```sql
SELECT p.*, u.first_name, u.last_name 
FROM pips p
JOIN users u ON p.employee_id = u.id
WHERE p.status IN ('ACTIVE', 'PENDING_EMPLOYEE_SELF_REVIEW', 'PENDING_MANAGER_REVIEW')
AND (p.employee_self_review_deadline < CURDATE() 
     OR p.manager_final_review_deadline < CURDATE()
     OR p.hrbp_final_decision_deadline < CURDATE());
```

### Get PIP statistics by manager
```sql
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    COUNT(p.id) as total_pips,
    SUM(CASE WHEN p.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_pips,
    SUM(CASE WHEN p.final_outcome = 'SUCCESSFUL' THEN 1 ELSE 0 END) as successful_pips
FROM users u
LEFT JOIN pips p ON u.id = p.manager_id
WHERE u.role = 'MANAGER'
GROUP BY u.id, u.first_name, u.last_name;
```

---

## Next Steps

1. Review and customize schema for your specific needs
2. Set up MySQL database and user (see setup guide)
3. Run `schema.sql` to create tables
4. Configure Spring Boot connection (see configuration guide)
5. Test connection and verify tables are created
6. Run application and verify data persistence
