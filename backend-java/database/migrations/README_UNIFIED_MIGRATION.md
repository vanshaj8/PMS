# Unified Architecture Database Migration Guide

## Overview

This migration transforms the database to support the unified Performance Management Platform architecture, where PIP and Appraisal modules share core services.

## Migration Files

### 1. `create_unified_core_tables.sql`
**Purpose**: Creates the new unified core tables
**When to run**: First, on a fresh database or before migrating data
**What it creates**:
- `workflow_phases` - Unified workflow phases
- `workflow_steps` - Individual steps within phases
- `shared_goals` - Unified goal entity (appraisal-first)
- `goal_ratings` - Ratings for goals
- `unified_reviews` - Unified review entity
- `enhanced_audit_logs` - Immutable audit logs with field-level tracking

### 2. `migrate_to_unified_architecture.sql`
**Purpose**: Migrates existing data from PIP and Appraisal tables to unified core tables
**When to run**: After creating core tables, on existing database with data
**What it migrates**:
- PIP steps → workflow_phases
- Appraisal phases → workflow_phases
- PIP goals → shared_goals
- Appraisal goals → shared_goals
- Appraisal review responses → unified_reviews
- Ratings → goal_ratings (if applicable)

### 3. `add_unified_foreign_keys.sql`
**Purpose**: Adds foreign key relationships and indexes
**When to run**: After data migration
**What it adds**:
- Foreign key constraints
- Performance indexes
- Composite indexes for common queries

### 4. `rollback_unified_migration.sql`
**Purpose**: Rolls back the migration (use with caution!)
**When to run**: Only if you need to revert the migration
**Warning**: This will delete all unified core data!

## Migration Steps

### Step 1: Backup Database
```sql
mysqldump -u username -p database_name > backup_before_unified_migration.sql
```

### Step 2: Create Core Tables
```bash
mysql -u username -p database_name < create_unified_core_tables.sql
```

### Step 3: Migrate Existing Data
```bash
mysql -u username -p database_name < migrate_to_unified_architecture.sql
```

### Step 4: Add Foreign Keys and Indexes
```bash
mysql -u username -p database_name < add_unified_foreign_keys.sql
```

### Step 5: Verify Migration
```sql
-- Check record counts
SELECT 
    'workflow_phases' as table_name, COUNT(*) as count FROM workflow_phases
UNION ALL
SELECT 'workflow_steps', COUNT(*) FROM workflow_steps
UNION ALL
SELECT 'shared_goals', COUNT(*) FROM shared_goals
UNION ALL
SELECT 'goal_ratings', COUNT(*) FROM goal_ratings
UNION ALL
SELECT 'unified_reviews', COUNT(*) FROM unified_reviews
UNION ALL
SELECT 'enhanced_audit_logs', COUNT(*) FROM enhanced_audit_logs;

-- Verify data integrity
SELECT 
    'PIP Phases' as check_type,
    COUNT(*) as count
FROM workflow_phases
WHERE workflow_context = 'PIP'
UNION ALL
SELECT 
    'Appraisal Phases',
    COUNT(*)
FROM workflow_phases
WHERE workflow_context = 'APPRAISAL'
UNION ALL
SELECT 
    'PIP Goals',
    COUNT(*)
FROM shared_goals
WHERE source_context = 'PIP'
UNION ALL
SELECT 
    'Appraisal Goals',
    COUNT(*)
FROM shared_goals
WHERE source_context = 'APPRAISAL';
```

## Data Mapping

### PIP Steps → Workflow Phases
- `pip_steps.step` → `workflow_phases.phase_key`
- `pip_steps.status` → `workflow_phases.status`
- `pip_steps.due_date` → `workflow_phases.due_date`
- `pip_steps.completed_date` → `workflow_phases.completed_at`

### Appraisal Phases → Workflow Phases
- `review_phases.phase_type` → `workflow_phases.phase_key`
- `review_phases.cycle_id` → `workflow_phases.workflow_id`
- `review_phases.is_locked` → `workflow_phases.is_locked`

### Goals → Shared Goals
- `goals` (PIP) → `shared_goals` with `source_context = 'PIP'`
- `appraisal_goals` → `shared_goals` with `source_context = 'APPRAISAL'`
- Goal type mapping:
  - PIP goals → `PIP_IMPROVEMENT_GOAL`
  - Appraisal goals → Original `goal_type` preserved

### Reviews → Unified Reviews
- `review_responses` → `unified_reviews` with `review_context = 'APPRAISAL'`
- Review type and role mapping preserved

## Important Notes

### 1. Foreign Key Constraints
MySQL doesn't support conditional foreign keys based on ENUM values. The migration script adds application-level validation instead. Foreign keys are added where possible, but some relationships are validated at the application level.

### 2. Data Preservation
- Original tables (pips, goals, pip_steps, etc.) are NOT dropped
- Data is copied to unified tables
- You can keep original tables for reference or drop them after validation

### 3. Rollback Strategy
- Original data remains in source tables
- Rollback script only drops unified core tables
- You can re-run migration if needed

### 4. Performance Considerations
- Indexes are added for common query patterns
- Composite indexes for context + status queries
- Consider adding more indexes based on your query patterns

## Troubleshooting

### Issue: Foreign key constraint fails
**Solution**: Check that referenced records exist in parent tables. The migration script includes data validation, but you may need to clean up orphaned records first.

### Issue: Duplicate key errors
**Solution**: The migration uses UUID() for new IDs. If you're re-running, drop unified tables first or modify the script to use existing IDs.

### Issue: Data count mismatch
**Solution**: Some records may not migrate if they don't meet criteria (e.g., NULL values). Check the migration script conditions and adjust if needed.

## Post-Migration Tasks

1. **Update Application Code**
   - Update services to use unified entities
   - Update repositories to use core repositories
   - Update controllers to use unified services

2. **Testing**
   - Test PIP workflows
   - Test Appraisal workflows
   - Verify data integrity
   - Test audit logging

3. **Performance Testing**
   - Monitor query performance
   - Add indexes if needed
   - Optimize slow queries

4. **Documentation**
   - Update API documentation
   - Update developer guides
   - Document new data model

## Support

For issues or questions:
1. Check migration logs
2. Verify data counts
3. Review foreign key constraints
4. Check application logs

## Version History

- **v2.0** (2024): Initial unified architecture migration
  - Core tables created
  - Data migration from PIP and Appraisal
  - Foreign keys and indexes added

