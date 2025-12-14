# Database Schema Documentation

## Overview

The PIP Management System uses MySQL 8.0+ with InnoDB engine and UTF8MB4 character set for full Unicode support.

## Database Information

- **Database Name**: `pip_management`
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- **Engine**: `InnoDB`

---

## Table Descriptions

### 1. users

**Purpose**: Stores all user accounts including employees, managers, HRBPs, administrators, and executives.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | Unique identifier (UUID) | PRIMARY KEY |
| email | VARCHAR(255) | User email address | NOT NULL, UNIQUE |
| password | VARCHAR(255) | Hashed password (BCrypt) | NOT NULL |
| first_name | VARCHAR(100) | User's first name | NOT NULL |
| last_name | VARCHAR(100) | User's last name | NOT NULL |
| role | ENUM | User role | NOT NULL |
| department | VARCHAR(100) | Department name | NULL |
| location | VARCHAR(100) | Office location | NULL |
| manager_id | VARCHAR(36) | Reference to manager user | FOREIGN KEY |
| hrbp_id | VARCHAR(36) | Reference to HRBP user | FOREIGN KEY |
| is_active | BOOLEAN | Account active status | DEFAULT TRUE |
| created_at | TIMESTAMP | Record creation time | AUTO |
| updated_at | TIMESTAMP | Last update time | AUTO |

**Relationships**:
- Self-referential: `manager_id` and `hrbp_id` reference `users.id`
- One-to-Many: One user can be manager/HRBP for many employees

**Indexes**:
- `idx_email` - Fast email lookups
- `idx_role` - Filter by role
- `idx_manager_id` - Find employees by manager
- `idx_hrbp_id` - Find employees by HRBP
- `idx_is_active` - Filter active users

---

### 2. pips

**Purpose**: Main table storing Performance Improvement Plans.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | Unique identifier | PRIMARY KEY |
| employee_id | VARCHAR(36) | Employee on PIP | NOT NULL, FK |
| manager_id | VARCHAR(36) | Manager who created PIP | NOT NULL, FK |
| hrbp_id | VARCHAR(36) | HRBP reviewing PIP | NOT NULL, FK |
| reason | TEXT | Reason for PIP creation | NULL |
| supporting_documents | TEXT | JSON array of document paths | NULL |
| status | ENUM | Current PIP status | NOT NULL |
| final_outcome | ENUM | Final decision outcome | NULL |
| final_remarks | TEXT | HRBP final comments | NULL |
| locked | BOOLEAN | PIP locked after completion | DEFAULT FALSE |
| version | INT | Version for optimistic locking | DEFAULT 1 |
| employee_acknowledgement_deadline | DATE | Deadline for employee acknowledgement | NULL |
| pip_active_duration | INT | Active period in days | NULL |
| employee_self_review_deadline | DATE | Self-review deadline | NULL |
| manager_final_review_deadline | DATE | Manager review deadline | NULL |
| hrbp_final_decision_deadline | DATE | HRBP decision deadline | NULL |
| grace_period | INT | Grace period in days | DEFAULT 0 |
| created_at | TIMESTAMP | Creation timestamp | AUTO |
| updated_at | TIMESTAMP | Last update timestamp | AUTO |

**Relationships**:
- Many-to-One: Many PIPs belong to one employee (`employee_id`)
- Many-to-One: Many PIPs created by one manager (`manager_id`)
- Many-to-One: Many PIPs reviewed by one HRBP (`hrbp_id`)
- One-to-Many: One PIP has many goals
- One-to-Many: One PIP has many steps
- One-to-Many: One PIP has many check-ins

**Indexes**:
- `idx_employee_id` - Find PIPs by employee
- `idx_manager_id` - Find PIPs by manager
- `idx_hrbp_id` - Find PIPs by HRBP
- `idx_status` - Filter by status
- `idx_created_at` - Sort by creation date
- `idx_employee_acknowledgement_deadline` - Find PIPs with approaching deadlines
- `idx_employee_self_review_deadline` - Find PIPs with approaching review deadlines

---

### 3. goals

**Purpose**: Stores individual improvement goals within a PIP.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | Unique identifier | PRIMARY KEY |
| pip_id | VARCHAR(36) | Parent PIP | NOT NULL, FK |
| title | VARCHAR(255) | Goal title | NOT NULL |
| description | TEXT | Detailed description | NULL |
| weightage | DECIMAL(5,2) | Goal importance (0-100%) | NOT NULL |
| expected_outcome | VARCHAR(500) | What success looks like | NULL |
| target_timeline | VARCHAR(100) | Timeline description | NULL |
| deadline | DATE | Specific deadline | NULL |
| justification | TEXT | Employee's justification | NULL |
| employee_attachments | TEXT | JSON array of documents | NULL |
| status | ENUM | Goal achievement status | DEFAULT 'NOT_ACHIEVED' |
| manager_comments | TEXT | Manager's assessment | NULL |
| created_at | TIMESTAMP | Creation time | AUTO |
| updated_at | TIMESTAMP | Update time | AUTO |

**Relationships**:
- Many-to-One: Many goals belong to one PIP (`pip_id`)

**Indexes**:
- `idx_pip_id` - Find goals by PIP
- `idx_status` - Filter by achievement status
- `idx_deadline` - Find goals by deadline

---

### 4. pip_steps

**Purpose**: Tracks workflow steps and their completion status for each PIP.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | Unique identifier | PRIMARY KEY |
| pip_id | VARCHAR(36) | Parent PIP | NOT NULL, FK |
| step | ENUM | Step name | NOT NULL |
| status | ENUM | Step status | NOT NULL |
| due_date | DATE | Step due date | NOT NULL |
| completed_date | DATE | Completion date | NULL |
| comments | TEXT | Step comments | NULL |
| signed_by | VARCHAR(36) | User who completed step | FK |
| created_at | TIMESTAMP | Creation time | AUTO |
| updated_at | TIMESTAMP | Update time | AUTO |

**Relationships**:
- Many-to-One: Many steps belong to one PIP (`pip_id`)
- Many-to-One: Step signed by one user (`signed_by`)

**Indexes**:
- `idx_pip_id` - Find steps by PIP
- `idx_step` - Filter by step type
- `idx_status` - Filter by status
- `idx_due_date` - Find overdue steps
- `idx_signed_by` - Find steps by signer

---

### 5. check_ins

**Purpose**: Stores progress check-ins during the active PIP period.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | Unique identifier | PRIMARY KEY |
| pip_id | VARCHAR(36) | Parent PIP | NOT NULL, FK |
| date | DATE | Check-in date | NOT NULL |
| notes | TEXT | Check-in notes | NULL |
| attachments | TEXT | JSON array of documents | NULL |
| created_at | TIMESTAMP | Creation time | AUTO |

**Relationships**:
- Many-to-One: Many check-ins belong to one PIP (`pip_id`)

**Indexes**:
- `idx_pip_id` - Find check-ins by PIP
- `idx_date` - Sort by date

---

### 6. audit_logs

**Purpose**: Tracks all important actions and changes for compliance and debugging.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | BIGINT | Auto-increment ID | PRIMARY KEY |
| entity_type | VARCHAR(50) | Type of entity | NOT NULL |
| entity_id | VARCHAR(36) | Entity identifier | NOT NULL |
| action | VARCHAR(50) | Action performed | NOT NULL |
| user_id | VARCHAR(36) | User who performed action | FK |
| user_email | VARCHAR(255) | User email (denormalized) | NULL |
| old_values | JSON | Previous state | NULL |
| new_values | JSON | New state | NULL |
| description | TEXT | Action description | NULL |
| ip_address | VARCHAR(45) | User IP address | NULL |
| created_at | TIMESTAMP | Action timestamp | AUTO |

**Relationships**:
- Many-to-One: Many logs from one user (`user_id`)

**Indexes**:
- `idx_entity` - Find logs by entity
- `idx_user_id` - Find logs by user
- `idx_action` - Filter by action type
- `idx_created_at` - Sort by time

---

### 7. notifications

**Purpose**: Stores system notifications for users.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | Unique identifier | PRIMARY KEY |
| user_id | VARCHAR(36) | Recipient user | NOT NULL, FK |
| title | VARCHAR(255) | Notification title | NOT NULL |
| message | TEXT | Notification message | NOT NULL |
| type | VARCHAR(50) | Notification type | DEFAULT 'INFO' |
| read | BOOLEAN | Read status | DEFAULT FALSE |
| action_url | VARCHAR(500) | URL to navigate | NULL |
| related_entity_type | VARCHAR(50) | Related entity type | NULL |
| related_entity_id | VARCHAR(36) | Related entity ID | NULL |
| created_at | TIMESTAMP | Creation time | AUTO |

**Relationships**:
- Many-to-One: Many notifications for one user (`user_id`)

**Indexes**:
- `idx_user_id` - Find notifications by user
- `idx_read` - Filter unread notifications
- `idx_created_at` - Sort by time
- `idx_user_read` - Composite for user unread count

---

### 8. timeline_overrides

**Purpose**: Tracks timeline changes made by administrators.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | Unique identifier | PRIMARY KEY |
| pip_id | VARCHAR(36) | Affected PIP | NOT NULL, FK |
| step_name | VARCHAR(100) | Step name | NOT NULL |
| original_deadline | DATE | Original deadline | NOT NULL |
| new_deadline | DATE | New deadline | NOT NULL |
| reason | TEXT | Reason for change | NOT NULL |
| overridden_by | VARCHAR(36) | Admin who made change | NOT NULL, FK |
| created_at | TIMESTAMP | Change timestamp | AUTO |

**Relationships**:
- Many-to-One: Many overrides for one PIP (`pip_id`)
- Many-to-One: Override made by one user (`overridden_by`)

**Indexes**:
- `idx_pip_id` - Find overrides by PIP
- `idx_overridden_by` - Find overrides by admin

---

### 9. goal_library (Optional)

**Purpose**: Stores reusable goal templates.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | Unique identifier | PRIMARY KEY |
| title | VARCHAR(255) | Goal title | NOT NULL |
| description | TEXT | Goal description | NULL |
| category | VARCHAR(100) | Goal category | NULL |
| created_by | VARCHAR(36) | Creator user | FK |
| is_active | BOOLEAN | Active status | DEFAULT TRUE |
| created_at | TIMESTAMP | Creation time | AUTO |
| updated_at | TIMESTAMP | Update time | AUTO |

**Relationships**:
- Many-to-One: Created by one user (`created_by`)

---

### 10. pip_templates (Optional)

**Purpose**: Stores reusable PIP templates.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | Unique identifier | PRIMARY KEY |
| name | VARCHAR(255) | Template name | NOT NULL |
| description | TEXT | Template description | NULL |
| goals | JSON | Goal templates | NULL |
| timeline_config | JSON | Timeline configuration | NULL |
| created_by | VARCHAR(36) | Creator user | FK |
| is_active | BOOLEAN | Active status | DEFAULT TRUE |
| created_at | TIMESTAMP | Creation time | AUTO |
| updated_at | TIMESTAMP | Update time | AUTO |

**Relationships**:
- Many-to-One: Created by one user (`created_by`)

---

## Entity Relationship Diagram (ERD) Summary

```
users (1) ──< (N) pips (employee_id)
users (1) ──< (N) pips (manager_id)
users (1) ──< (N) pips (hrbp_id)
users (1) ──< (N) users (manager_id) [self-referential]
users (1) ──< (N) users (hrbp_id) [self-referential]

pips (1) ──< (N) goals
pips (1) ──< (N) pip_steps
pips (1) ──< (N) check_ins
pips (1) ──< (N) timeline_overrides

users (1) ──< (N) pip_steps (signed_by)
users (1) ──< (N) notifications
users (1) ──< (N) audit_logs
users (1) ──< (N) goal_library (created_by)
users (1) ──< (N) pip_templates (created_by)
```

---

## Data Types and Constraints

### Enums

**User Roles**: `ADMIN`, `MANAGER`, `EMPLOYEE`, `HRBP`, `EXECUTIVE`

**PIP Status**: `DRAFT`, `PENDING_HRBP_REVIEW`, `PENDING_EMPLOYEE_ACKNOWLEDGEMENT`, `ACTIVE`, `PENDING_EMPLOYEE_SELF_REVIEW`, `PENDING_MANAGER_REVIEW`, `PENDING_HRBP_DECISION`, `COMPLETED`, `OVERDUE`, `CANCELLED`

**Final Outcome**: `SUCCESSFUL`, `UNSUCCESSFUL`, `EXTENDED`, `CLOSED_WITHOUT_ACTION`

**Goal Status**: `ACHIEVED`, `PARTIALLY_ACHIEVED`, `NOT_ACHIEVED`

**Step Name**: `EMPLOYEE_ACKNOWLEDGEMENT`, `ACTIVE_PIP`, `EMPLOYEE_SELF_REVIEW`, `MANAGER_REVIEW`, `HRBP_DECISION`, `HRBP_REVIEW`

**Step Status**: `PENDING`, `DUE_SOON`, `OVERDUE`, `COMPLETED`

---

## Indexes Strategy

### Primary Indexes
- All tables have `id` as PRIMARY KEY

### Foreign Key Indexes
- All foreign keys are indexed for join performance

### Query Optimization Indexes
- Status fields for filtering
- Date fields for sorting and range queries
- Email for user lookups
- Composite indexes for common query patterns

---

## Security Considerations

1. **Password Storage**: Passwords are hashed using BCrypt (60 character hash)
2. **SQL Injection**: Use parameterized queries (JPA handles this)
3. **Data Validation**: Application layer validates before database
4. **Access Control**: Row-level security via application logic
5. **Audit Trail**: All changes tracked in `audit_logs`

---

## Performance Optimization

1. **Indexes**: Strategic indexes on frequently queried columns
2. **Partitioning**: Consider partitioning `audit_logs` by date for large datasets
3. **Connection Pooling**: HikariCP configured for optimal connections
4. **Query Optimization**: Use EXPLAIN to analyze slow queries
5. **Caching**: Consider Redis for frequently accessed data

---

## Backup and Recovery

1. **Regular Backups**: Daily full backups recommended
2. **Transaction Logs**: Enable binary logging for point-in-time recovery
3. **Replication**: Consider master-slave replication for high availability
4. **Retention**: Keep backups for at least 90 days

---

## Migration Strategy

1. **Development**: Use `spring.jpa.hibernate.ddl-auto=update` for development
2. **Production**: Use `validate` and manage schema with Flyway/Liquibase
3. **Version Control**: Keep SQL scripts in version control
4. **Testing**: Test migrations on staging before production
