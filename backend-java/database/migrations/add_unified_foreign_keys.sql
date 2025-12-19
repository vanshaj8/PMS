-- =====================================================
-- Unified Performance Management Platform
-- Foreign Key Relationships
-- =====================================================
-- This script adds foreign key relationships for the unified architecture
-- Run after create_unified_core_tables.sql and migrate_to_unified_architecture.sql
-- Version: 2.0
-- Created: 2024
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- Workflow Phases Foreign Keys
-- =====================================================

-- Note: MySQL doesn't support conditional foreign keys based on ENUM values
-- We'll add application-level validation instead
-- But we can add indexes for performance

-- Note: MySQL doesn't support conditional indexes with WHERE clauses
-- Use composite indexes instead for better query performance

-- Composite indexes for workflow lookups (works in all MySQL versions)
CREATE INDEX idx_workflow_phase_pip_lookup ON workflow_phases(workflow_id, workflow_context);
CREATE INDEX idx_workflow_phase_appraisal_lookup ON workflow_phases(workflow_id, workflow_context);

-- =====================================================
-- Shared Goals Foreign Keys
-- =====================================================

-- Foreign key to users (employee)
ALTER TABLE shared_goals
ADD CONSTRAINT fk_shared_goal_employee 
FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Self-referencing foreign key for goal versioning
ALTER TABLE shared_goals
ADD CONSTRAINT fk_shared_goal_parent 
FOREIGN KEY (parent_goal_id) REFERENCES shared_goals(id) ON DELETE SET NULL;

-- =====================================================
-- Goal Ratings Foreign Keys
-- =====================================================

-- Foreign key to shared_goals
ALTER TABLE goal_ratings
ADD CONSTRAINT fk_goal_rating_goal 
FOREIGN KEY (goal_id) REFERENCES shared_goals(id) ON DELETE CASCADE;

-- Foreign key to users (rater)
ALTER TABLE goal_ratings
ADD CONSTRAINT fk_goal_rating_rater 
FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE RESTRICT;

-- =====================================================
-- Unified Reviews Foreign Keys
-- =====================================================

-- Foreign key to users (reviewer)
ALTER TABLE unified_reviews
ADD CONSTRAINT fk_unified_review_reviewer 
FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Foreign key to users (reviewee)
ALTER TABLE unified_reviews
ADD CONSTRAINT fk_unified_review_reviewee 
FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Foreign key to review_forms (if exists)
-- Check if review_forms table exists before adding
SET @table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = 'review_forms'
);

SET @sql = IF(@table_exists > 0,
    'ALTER TABLE unified_reviews ADD CONSTRAINT fk_unified_review_form FOREIGN KEY (form_id) REFERENCES review_forms(id) ON DELETE SET NULL',
    'SELECT "review_forms table does not exist, skipping foreign key" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- Enhanced Audit Logs Foreign Keys
-- =====================================================

-- Foreign key to users
ALTER TABLE enhanced_audit_logs
ADD CONSTRAINT fk_audit_log_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- =====================================================
-- Additional Indexes for Performance
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_workflow_phase_context_status ON workflow_phases(workflow_context, status);
CREATE INDEX idx_workflow_phase_due_date ON workflow_phases(due_date);
CREATE INDEX idx_shared_goal_employee_status ON shared_goals(employee_id, status);
CREATE INDEX idx_shared_goal_source ON shared_goals(source_context, source_id);
CREATE INDEX idx_unified_review_context_type ON unified_reviews(review_context, review_type);
CREATE INDEX idx_unified_review_reviewer_status ON unified_reviews(reviewer_id, status);
CREATE INDEX idx_audit_log_context_entity ON enhanced_audit_logs(context, entity_type, entity_id);
CREATE INDEX idx_audit_log_user_action ON enhanced_audit_logs(user_id, action);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check foreign key constraints
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME IS NOT NULL
AND TABLE_NAME IN (
    'workflow_phases',
    'workflow_steps',
    'shared_goals',
    'goal_ratings',
    'unified_reviews',
    'enhanced_audit_logs'
)
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Check indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'workflow_phases',
    'workflow_steps',
    'shared_goals',
    'goal_ratings',
    'unified_reviews',
    'enhanced_audit_logs'
)
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

