# Database Migration for Unified Architecture - Complete

## ✅ Migration Scripts Created

### 1. Core Tables Creation
**File**: `backend-java/database/migrations/create_unified_core_tables.sql`

Creates 6 new unified core tables:
- `workflow_phases` - Unified workflow phases (supports PIP and Appraisal)
- `workflow_steps` - Individual steps within phases
- `shared_goals` - Unified goal entity (appraisal-first, versioned)
- `goal_ratings` - Ratings for individual goals
- `unified_reviews` - Unified review entity (context-aware)
- `enhanced_audit_logs` - Immutable audit logs with field-level tracking

### 2. Data Migration
**File**: `backend-java/database/migrations/migrate_to_unified_architecture.sql`

Migrates existing data:
- ✅ PIP steps → workflow_phases
- ✅ Appraisal phases → workflow_phases
- ✅ PIP goals → shared_goals
- ✅ Appraisal goals → shared_goals
- ✅ Appraisal review responses → unified_reviews
- ✅ Ratings → goal_ratings (where applicable)

### 3. Foreign Keys and Indexes
**File**: `backend-java/database/migrations/add_unified_foreign_keys.sql`

Adds:
- Foreign key constraints
- Performance indexes
- Composite indexes for common queries

### 4. Rollback Script
**File**: `backend-java/database/migrations/rollback_unified_migration.sql`

Rolls back migration (use with caution - deletes unified core data)

### 5. Migration Runner Script
**File**: `backend-java/database/migrations/run_unified_migration.sh`

Automated script to run migrations in correct order

### 6. Documentation
**File**: `backend-java/database/migrations/README_UNIFIED_MIGRATION.md`

Complete migration guide with:
- Step-by-step instructions
- Data mapping documentation
- Troubleshooting guide
- Post-migration tasks

## 📊 Database Schema Overview

### New Core Tables

```
workflow_phases
├── Supports both PIP (sequential) and Appraisal (phase-based)
├── Tracks phase status, deadlines, locking
└── References workflow_id (PIP or AppraisalCycle)

workflow_steps
├── Individual steps within phases
└── References workflow_phases

shared_goals
├── Unified goal entity
├── Appraisal-first design
├── Versioned (parent_goal_id)
└── Tracks source_context (PIP/APPRAISAL)

goal_ratings
├── Ratings for goals
├── Multiple sources (Self, Manager, HRBP, etc.)
└── References shared_goals

unified_reviews
├── Unified review entity
├── Context-aware (PIP/APPRAISAL)
├── Role-based (Employee, Manager, HRBP, etc.)
└── Form-based responses

enhanced_audit_logs
├── Immutable audit logs
├── Field-level change tracking
├── Mandatory override reasons
└── IP address and user agent tracking
```

## 🚀 How to Run Migration

### Option 1: Using the Runner Script (Recommended)

```bash
cd backend-java/database/migrations
./run_unified_migration.sh
```

### Option 2: Manual Execution

```bash
# Step 1: Backup database
mysqldump -u username -p database_name > backup.sql

# Step 2: Create core tables
mysql -u username -p database_name < create_unified_core_tables.sql

# Step 3: Migrate data
mysql -u username -p database_name < migrate_to_unified_architecture.sql

# Step 4: Add foreign keys
mysql -u username -p database_name < add_unified_foreign_keys.sql
```

## 📋 Migration Checklist

- [ ] Backup database
- [ ] Review migration scripts
- [ ] Run `create_unified_core_tables.sql`
- [ ] Verify tables created
- [ ] Run `migrate_to_unified_architecture.sql`
- [ ] Verify data migrated (check counts)
- [ ] Run `add_unified_foreign_keys.sql`
- [ ] Verify foreign keys and indexes
- [ ] Test application with new schema
- [ ] Update application code to use unified entities

## 🔍 Verification Queries

After migration, run these to verify:

```sql
-- Check table counts
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

-- Check PIP data migration
SELECT 
    'PIP Phases' as check_type,
    COUNT(*) as count
FROM workflow_phases
WHERE workflow_context = 'PIP';

-- Check Appraisal data migration
SELECT 
    'Appraisal Phases' as check_type,
    COUNT(*) as count
FROM workflow_phases
WHERE workflow_context = 'APPRAISAL';

-- Check goal migration
SELECT 
    source_context,
    COUNT(*) as count
FROM shared_goals
GROUP BY source_context;
```

## ⚠️ Important Notes

1. **Original Tables Preserved**: Original tables (pips, goals, pip_steps, etc.) are NOT dropped. Data is copied to unified tables.

2. **Foreign Key Limitations**: MySQL doesn't support conditional foreign keys. Some relationships are validated at application level.

3. **Data Integrity**: Migration includes data validation, but review orphaned records before migration.

4. **Rollback Available**: Rollback script available, but use with caution - it deletes unified core data.

5. **Performance**: Indexes added for common queries. Monitor and add more as needed.

## 📝 Next Steps After Migration

1. **Update Application Code**
   - Update services to use unified entities
   - Update repositories to use core repositories
   - Update controllers to use unified services

2. **Testing**
   - Test PIP workflows
   - Test Appraisal workflows
   - Verify data integrity
   - Test audit logging

3. **Performance Optimization**
   - Monitor query performance
   - Add indexes if needed
   - Optimize slow queries

4. **Documentation**
   - Update API documentation
   - Update developer guides
   - Document new data model

## 🎯 Migration Status

✅ **Core Tables**: Created
✅ **Data Migration**: Scripts ready
✅ **Foreign Keys**: Scripts ready
✅ **Indexes**: Scripts ready
✅ **Rollback**: Script ready
✅ **Documentation**: Complete

**Ready to migrate!** 🚀

