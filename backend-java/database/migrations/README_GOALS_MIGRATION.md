# Goals Module Database Migration Guide

## Overview

This migration introduces a centralized Goals module that becomes the single source of truth for all goals. PIP and Appraisal modules now reference goals instead of duplicating them.

## Key Changes

1. **Centralized Goals Table**: All goals stored in one place
2. **Goal Versioning**: Immutable version history
3. **Goal References**: PIP and Appraisal link to goals, don't duplicate
4. **Appraisal Snapshots**: Immutable snapshots at cycle start
5. **PIP Direct Links**: PIPs reference goal versions directly

## Migration Files

### 1. `create_goals_module_tables.sql`
**Purpose**: Creates the Goals module tables
**When to run**: First, before migrating data
**What it creates**:
- `goals` - Centralized goal entity
- `goal_versions` - Immutable version history
- `goal_context_links` - Links goals to contexts
- `pip_goal_links` - Links goals to PIPs
- `appraisal_goal_snapshots` - Immutable appraisal snapshots

### 2. `migrate_existing_goals.sql`
**Purpose**: Migrates existing PIP and Appraisal goals
**When to run**: After creating tables, on existing database
**What it migrates**:
- PIP goals → goals table
- Appraisal goals → goals table
- Creates goal versions
- Creates context links
- Creates PIP goal links
- Creates appraisal snapshots (for active cycles)

## Migration Steps

### Step 1: Backup Database
```sql
mysqldump -u username -p database_name > backup_before_goals_migration.sql
```

### Step 2: Create Goals Tables
```bash
mysql -u username -p database_name < create_goals_module_tables.sql
```

### Step 3: Migrate Existing Goals
```bash
mysql -u username -p database_name < migrate_existing_goals.sql
```

### Step 4: Verify Migration
```sql
-- Check goal counts
SELECT 
    'Total Goals' as metric, COUNT(*) as count FROM goals
UNION ALL
SELECT 'PIP Goals', COUNT(*) FROM goals WHERE created_in_context = 'PIP'
UNION ALL
SELECT 'Appraisal Goals', COUNT(*) FROM goals WHERE created_in_context = 'APPRAISAL'
UNION ALL
SELECT 'Goal Versions', COUNT(*) FROM goal_versions
UNION ALL
SELECT 'PIP Links', COUNT(*) FROM pip_goal_links
UNION ALL
SELECT 'Context Links', COUNT(*) FROM goal_context_links
UNION ALL
SELECT 'Appraisal Snapshots', COUNT(*) FROM appraisal_goal_snapshots;
```

## Data Model

### Goals Table
- Centralized goal storage
- Version tracking
- Locking mechanism
- Context awareness

### Goal Versions
- Immutable history
- Field-level change tracking
- Change reasons

### Goal Context Links
- Links goals to PIP/Appraisal
- Tracks which version was used
- Snapshot flag for Appraisal

### PIP Goal Links
- Direct references from PIP to goals
- Version-specific
- Weightage in PIP context

### Appraisal Goal Snapshots
- Immutable copies at cycle start
- Never changes after snapshot
- Used for evaluations

## Post-Migration Tasks

1. **Update Application Code**
   - Update PIP service to use goal references
   - Update Appraisal service to use goal snapshots
   - Update UI to show goals from centralized module

2. **Testing**
   - Test goal creation
   - Test goal versioning
   - Test PIP goal linking
   - Test Appraisal snapshots
   - Test goal locking

3. **Data Validation**
   - Verify all goals migrated
   - Verify version history
   - Verify context links
   - Verify snapshots

## Benefits

✅ **No Duplication**: Goals stored once, referenced many times
✅ **Version Control**: Complete history of goal changes
✅ **Auditability**: Full audit trail of goal modifications
✅ **Flexibility**: Goals can be reused across cycles
✅ **Legal Safety**: Immutable snapshots for completed cycles

## Important Notes

1. **Original Tables**: Old goal tables are NOT dropped. Keep for reference or drop after validation.

2. **Versioning**: All migrated goals start at version 1. New versions created on updates.

3. **Snapshots**: Appraisal snapshots are created when cycles start. Existing active cycles get snapshots during migration.

4. **Locking**: Goals are locked when used in active cycles. Locked goals cannot be modified.

5. **References**: PIP and Appraisal now reference goals, not duplicate them.

