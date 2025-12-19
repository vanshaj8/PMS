-- =====================================================
-- Unified Performance Management Platform
-- Data Migration Script
-- =====================================================
-- This script migrates existing PIP and Appraisal data
-- to the unified core tables
-- Version: 2.0
-- Created: 2024
-- =====================================================

-- IMPORTANT: Run create_unified_core_tables.sql first!

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- Step 1: Migrate PIP Steps to Workflow Phases
-- =====================================================

INSERT INTO workflow_phases (
    id,
    workflow_id,
    workflow_context,
    phase_name,
    phase_key,
    sequence_order,
    can_run_parallel,
    due_date,
    status,
    is_locked,
    locked_at,
    completed_at,
    assigned_role,
    metadata,
    created_at,
    updated_at
)
SELECT 
    UUID() as id,
    pip_id as workflow_id,
    'PIP' as workflow_context,
    CASE 
        WHEN step = 'EMPLOYEE_ACKNOWLEDGEMENT' THEN 'Employee Acknowledgement'
        WHEN step = 'ACTIVE_PIP' THEN 'Active PIP Period'
        WHEN step = 'EMPLOYEE_SELF_REVIEW' THEN 'Employee Self Review'
        WHEN step = 'MANAGER_REVIEW' THEN 'Manager Review'
        WHEN step = 'HRBP_REVIEW' THEN 'HRBP Initial Review'
        WHEN step = 'HRBP_DECISION' THEN 'HRBP Final Decision'
        ELSE step
    END as phase_name,
    step as phase_key,
    CASE 
        WHEN step = 'HRBP_REVIEW' THEN 1
        WHEN step = 'EMPLOYEE_ACKNOWLEDGEMENT' THEN 2
        WHEN step = 'ACTIVE_PIP' THEN 3
        WHEN step = 'EMPLOYEE_SELF_REVIEW' THEN 4
        WHEN step = 'MANAGER_REVIEW' THEN 5
        WHEN step = 'HRBP_DECISION' THEN 6
        ELSE 0
    END as sequence_order,
    FALSE as can_run_parallel,
    due_date,
    CASE 
        WHEN status = 'COMPLETED' THEN 'COMPLETED'
        WHEN status = 'OVERDUE' THEN 'OVERDUE'
        WHEN status = 'DUE_SOON' THEN 'DUE_SOON'
        ELSE 'PENDING'
    END as status,
    CASE WHEN status = 'COMPLETED' THEN TRUE ELSE FALSE END as is_locked,
    CASE WHEN status = 'COMPLETED' THEN completed_date ELSE NULL END as locked_at,
    completed_date as completed_at,
    CASE 
        WHEN step = 'EMPLOYEE_ACKNOWLEDGEMENT' THEN 'EMPLOYEE'
        WHEN step = 'EMPLOYEE_SELF_REVIEW' THEN 'EMPLOYEE'
        WHEN step = 'MANAGER_REVIEW' THEN 'MANAGER'
        WHEN step = 'HRBP_REVIEW' THEN 'HRBP'
        WHEN step = 'HRBP_DECISION' THEN 'HRBP'
        ELSE NULL
    END as assigned_role,
    JSON_OBJECT('original_step_id', id, 'signed_by', signed_by, 'comments', comments) as metadata,
    created_at,
    updated_at
FROM pip_steps
WHERE step IS NOT NULL;

-- =====================================================
-- Step 2: Migrate Appraisal Phases to Workflow Phases
-- =====================================================

INSERT INTO workflow_phases (
    id,
    workflow_id,
    workflow_context,
    phase_name,
    phase_key,
    sequence_order,
    can_run_parallel,
    start_date,
    end_date,
    due_date,
    buffer_days,
    auto_lock_after_deadline,
    status,
    is_locked,
    locked_at,
    completed_at,
    metadata,
    created_at,
    updated_at
)
SELECT 
    id,
    cycle_id as workflow_id,
    'APPRAISAL' as workflow_context,
    phase_name,
    phase_type as phase_key,
    sequence_order,
    TRUE as can_run_parallel, -- Appraisal phases can run in parallel
    start_date,
    end_date,
    end_date as due_date,
    buffer_days,
    auto_lock_after_deadline,
    CASE 
        WHEN is_locked THEN 'COMPLETED'
        ELSE 'PENDING'
    END as status,
    is_locked,
    locked_at,
    NULL as completed_at,
    JSON_OBJECT('original_phase_id', id) as metadata,
    created_at,
    updated_at
FROM review_phases;

-- =====================================================
-- Step 3: Migrate PIP Goals to Shared Goals
-- =====================================================

INSERT INTO shared_goals (
    id,
    employee_id,
    title,
    description,
    weightage,
    goal_type,
    success_criteria,
    status,
    target_date,
    version,
    source_context,
    source_id,
    locked,
    created_at,
    updated_at
)
SELECT 
    id,
    (SELECT employee_id FROM pips WHERE pips.id = goals.pip_id) as employee_id,
    title,
    description,
    weightage,
    'PIP_IMPROVEMENT_GOAL' as goal_type,
    expected_outcome as success_criteria,
    CASE 
        WHEN status = 'ACHIEVED' THEN 'ACHIEVED'
        WHEN status = 'PARTIALLY_ACHIEVED' THEN 'PARTIALLY_ACHIEVED'
        WHEN status = 'NOT_ACHIEVED' THEN 'NOT_ACHIEVED'
        ELSE 'ACTIVE'
    END as status,
    CASE 
        WHEN deadline IS NOT NULL AND deadline != '' THEN STR_TO_DATE(deadline, '%Y-%m-%d')
        ELSE NULL
    END as target_date,
    1 as version,
    'PIP' as source_context,
    pip_id as source_id,
    FALSE as locked,
    created_at,
    updated_at
FROM goals
WHERE pip_id IS NOT NULL;

-- =====================================================
-- Step 4: Migrate Appraisal Goals to Shared Goals
-- =====================================================

INSERT INTO shared_goals (
    id,
    employee_id,
    title,
    description,
    weightage,
    goal_type,
    success_criteria,
    status,
    target_date,
    version,
    source_context,
    source_id,
    locked,
    created_at,
    updated_at
)
SELECT 
    id,
    (SELECT employee_id FROM appraisal_participants WHERE appraisal_participants.id = appraisal_goals.participant_id) as employee_id,
    title,
    description,
    weightage,
    goal_type,
    success_criteria,
    status,
    NULL as target_date,
    1 as version,
    'APPRAISAL' as source_context,
    participant_id as source_id,
    FALSE as locked,
    created_at,
    updated_at
FROM appraisal_goals
WHERE participant_id IS NOT NULL;

-- =====================================================
-- Step 5: Migrate Appraisal Review Responses to Unified Reviews
-- =====================================================

INSERT INTO unified_reviews (
    id,
    review_context,
    context_id,
    review_type,
    review_role,
    reviewer_id,
    reviewee_id,
    form_id,
    responses,
    status,
    submitted_at,
    is_locked,
    locked_at,
    created_at,
    updated_at
)
SELECT 
    id,
    'APPRAISAL' as review_context,
    participant_id as context_id,
    review_type,
    CASE 
        WHEN review_type = 'SELF_REVIEW' THEN 'EMPLOYEE'
        WHEN review_type = 'MANAGER_REVIEW' THEN 'MANAGER'
        WHEN review_type = 'SKIP_REVIEW' THEN 'SKIP_LEVEL_MANAGER'
        WHEN review_type = 'HR_REVIEW' THEN 'HR'
        WHEN review_type = 'CALIBRATION_REVIEW' THEN 'HRBP'
        ELSE 'EMPLOYEE'
    END as review_role,
    reviewer_id,
    (SELECT employee_id FROM appraisal_participants WHERE appraisal_participants.id = review_responses.participant_id) as reviewee_id,
    form_id,
    responses,
    CASE 
        WHEN status = 'SUBMITTED' THEN 'SUBMITTED'
        WHEN status = 'LOCKED' THEN 'LOCKED'
        WHEN status = 'AMENDED' THEN 'AMENDED'
        ELSE 'DRAFT'
    END as status,
    submitted_at,
    is_locked,
    locked_at,
    created_at,
    updated_at
FROM review_responses
WHERE participant_id IS NOT NULL;

-- =====================================================
-- Step 6: Migrate Ratings to Goal Ratings (if applicable)
-- =====================================================

-- Note: This assumes ratings can be mapped to goals
-- You may need to adjust based on your rating structure

INSERT INTO goal_ratings (
    id,
    goal_id,
    rating_source,
    rater_id,
    rating_value,
    rating_label,
    is_final,
    created_at,
    updated_at
)
SELECT 
    id,
    -- Map rating to goal based on participant and context
    -- This is a simplified mapping - adjust as needed
    (SELECT id FROM shared_goals 
     WHERE source_context = 'APPRAISAL' 
     AND source_id = ratings.participant_id 
     LIMIT 1) as goal_id,
    rating_source,
    rater_id,
    rating_value,
    rating_label,
    is_final,
    created_at,
    updated_at
FROM ratings
WHERE participant_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM shared_goals 
    WHERE source_context = 'APPRAISAL' 
    AND source_id = ratings.participant_id
);

-- =====================================================
-- Step 7: Create Enhanced Audit Logs from existing data
-- =====================================================

-- Note: If you have existing audit logs, migrate them here
-- This is a template - adjust based on your audit log structure

-- INSERT INTO enhanced_audit_logs (
--     id,
--     context,
--     context_id,
--     action,
--     entity_type,
--     entity_id,
--     user_id,
--     user_role,
--     created_at
-- )
-- SELECT 
--     UUID() as id,
--     'PIP' as context,
--     pip_id as context_id,
--     'AUDIT_ACTION' as action,
--     'PIP' as entity_type,
--     pip_id as entity_id,
--     user_id,
--     user_role,
--     created_at
-- FROM existing_audit_logs;

-- =====================================================
-- Step 8: Add Foreign Key Constraints
-- =====================================================

-- Add foreign key from workflow_phases to pips (for PIP context)
ALTER TABLE workflow_phases
ADD CONSTRAINT fk_phase_pip 
FOREIGN KEY (workflow_id) REFERENCES pips(id) ON DELETE CASCADE
WHERE workflow_context = 'PIP';

-- Add foreign key from workflow_phases to appraisal_cycles (for Appraisal context)
ALTER TABLE workflow_phases
ADD CONSTRAINT fk_phase_appraisal_cycle 
FOREIGN KEY (workflow_id) REFERENCES appraisal_cycles(id) ON DELETE CASCADE
WHERE workflow_context = 'APPRAISAL';

-- Note: MySQL doesn't support conditional foreign keys
-- You may need to handle this at application level or use triggers

-- Add foreign key from unified_reviews to review_forms
ALTER TABLE unified_reviews
ADD CONSTRAINT fk_review_form 
FOREIGN KEY (form_id) REFERENCES review_forms(id) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Step 9: Update Statistics
-- =====================================================

ANALYZE TABLE workflow_phases;
ANALYZE TABLE workflow_steps;
ANALYZE TABLE shared_goals;
ANALYZE TABLE goal_ratings;
ANALYZE TABLE unified_reviews;
ANALYZE TABLE enhanced_audit_logs;

-- =====================================================
-- Migration Complete
-- =====================================================

SELECT 
    'Migration completed successfully' as status,
    (SELECT COUNT(*) FROM workflow_phases) as workflow_phases_count,
    (SELECT COUNT(*) FROM workflow_steps) as workflow_steps_count,
    (SELECT COUNT(*) FROM shared_goals) as shared_goals_count,
    (SELECT COUNT(*) FROM goal_ratings) as goal_ratings_count,
    (SELECT COUNT(*) FROM unified_reviews) as unified_reviews_count,
    (SELECT COUNT(*) FROM enhanced_audit_logs) as audit_logs_count;

