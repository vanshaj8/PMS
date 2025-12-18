# Database Migration Status

**Date:** December 19, 2025  
**Status:** ✅ Migration Script Ready

---

## Migration Script Location

**File:** `backend-java/database/migrations/add_deadline_fix_columns_simple.sql`

---

## What the Migration Does

### 1. Adds Timestamp Columns to `pips` Table

```sql
ALTER TABLE pips 
ADD COLUMN hrbp_approved_at DATETIME NULL,
ADD COLUMN employee_acknowledged_at DATETIME NULL,
ADD COLUMN active_period_started_at DATETIME NULL,
ADD COLUMN active_period_ended_at DATETIME NULL,
ADD COLUMN self_review_submitted_at DATETIME NULL,
ADD COLUMN manager_review_completed_at DATETIME NULL;
```

### 2. Adds Extension Tracking Columns

```sql
ALTER TABLE pips
ADD COLUMN extension_count INT DEFAULT 0,
ADD COLUMN original_active_duration INT NULL;
```

### 3. Adds Duration Columns to Timeline

```sql
ALTER TABLE pips
ADD COLUMN employee_acknowledgement_duration INT NULL,
ADD COLUMN self_review_buffer_duration INT NULL,
ADD COLUMN manager_review_buffer_duration INT NULL,
ADD COLUMN hrbp_decision_buffer_duration INT NULL;
```

### 4. Updates PIP Status Enum

Adds new status values:
- `OVERDUE_EMPLOYEE_ACKNOWLEDGEMENT`
- `ACTIVE_PENDING_VALIDATION`
- `OVERDUE_MANAGER_REVIEW`
- `OVERDUE_HRBP_DECISION`
- `ADMIN_INTERVENTION_REQUIRED`
- `DEEMED_ACKNOWLEDGED`

### 5. Creates `deadline_policies` Table

Creates a new table for deadline policy configuration with default values.

---

## How to Run the Migration

### For MySQL Database

```bash
# Connect to MySQL
mysql -u root -p pip_management

# Run the migration
source backend-java/database/migrations/add_deadline_fix_columns_simple.sql
```

### For H2 Database (Development)

The H2 database will automatically create these columns when the application starts if using JPA auto-ddl. However, for production, you should run the migration manually.

---

## Verification

After running the migration, verify the changes:

```sql
-- Check if new columns exist
DESCRIBE pips;

-- Check if new status values are available
SHOW COLUMNS FROM pips LIKE 'status';

-- Check if deadline_policies table exists
SHOW TABLES LIKE 'deadline_policies';

-- Verify default policy was created
SELECT * FROM deadline_policies WHERE active = TRUE;
```

---

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Remove new columns (be careful - this will lose data!)
ALTER TABLE pips 
DROP COLUMN hrbp_approved_at,
DROP COLUMN employee_acknowledged_at,
DROP COLUMN active_period_started_at,
DROP COLUMN active_period_ended_at,
DROP COLUMN self_review_submitted_at,
DROP COLUMN manager_review_completed_at,
DROP COLUMN extension_count,
DROP COLUMN original_active_duration,
DROP COLUMN employee_acknowledgement_duration,
DROP COLUMN self_review_buffer_duration,
DROP COLUMN manager_review_buffer_duration,
DROP COLUMN hrbp_decision_buffer_duration;

-- Revert status enum (MySQL doesn't support removing enum values easily)
-- You may need to recreate the table or use ALTER TABLE with the old enum values

-- Drop deadline_policies table
DROP TABLE IF EXISTS deadline_policies;
```

---

## Current Status

- ✅ Migration script created
- ✅ All required columns defined
- ✅ Status enum updated
- ✅ Deadline policies table created
- ⚠️ **Migration needs to be run on your database**

---

## Next Steps

1. **Backup your database** before running the migration
2. **Run the migration script** on your database
3. **Verify the changes** using the verification queries above
4. **Test the application** to ensure everything works correctly

---

## Notes

- The migration is **idempotent** - it uses `IF NOT EXISTS` and `INSERT IGNORE` to prevent errors if run multiple times
- All new columns are **nullable** to allow existing records to work
- Default values are set where appropriate
- The migration includes a default deadline policy that will be created automatically

---

**Last Updated:** December 19, 2025

