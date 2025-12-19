-- =====================================================
-- Migrate Existing Goals to Centralized Goals Module
-- =====================================================
-- This script migrates existing PIP and Appraisal goals
-- to the centralized goals table
-- Version: 2.1
-- Created: 2024
-- =====================================================

-- IMPORTANT: Run create_goals_module_tables.sql first!
-- IMPORTANT: This assumes the old goals table will be renamed to goals_legacy
--            or you'll need to adjust table names accordingly

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- Step 1: Migrate PIP Goals to Centralized Goals
-- =====================================================
-- Note: Adjust table name if your existing goals table is different

-- First, check if we need to rename the existing goals table
-- If goals table exists with pip_id column, we'll migrate from it
-- Otherwise, skip PIP goal migration

SET @has_pip_goals = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'goals' 
    AND column_name = 'pip_id'
);

-- Migrate PIP goals if they exist
SET @sql = IF(@has_pip_goals > 0,
    'INSERT INTO goals (
        id,
        employee_id,
        title,
        description,
        weightage,
        goal_type,
        success_criteria,
        status,
        target_date,
        version_number,
        is_current_version,
        created_in_context,
        created_in_context_id,
        is_locked,
        created_at,
        updated_at
    )
    SELECT 
        id,
        (SELECT employee_id FROM pips WHERE pips.id = goals.pip_id LIMIT 1) as employee_id,
        title,
        description,
        weightage,
        ''PIP_IMPROVEMENT_GOAL'' as goal_type,
        expected_outcome as success_criteria,
        CASE 
            WHEN status = ''ACHIEVED'' THEN ''ACHIEVED''
            WHEN status = ''PARTIALLY_ACHIEVED'' THEN ''PARTIALLY_ACHIEVED''
            WHEN status = ''NOT_ACHIEVED'' THEN ''NOT_ACHIEVED''
            ELSE ''ACTIVE''
        END as status,
        CASE 
            WHEN deadline IS NOT NULL AND deadline != '''' THEN deadline
            ELSE NULL
        END as target_date,
        1 as version_number,
        TRUE as is_current_version,
        ''PIP'' as created_in_context,
        pip_id as created_in_context_id,
        FALSE as is_locked,
        created_at,
        updated_at
    FROM goals
    WHERE pip_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM goals g2 
        WHERE g2.id = goals.id 
        AND g2.created_in_context IS NOT NULL
    )',
    'SELECT "No PIP goals table found, skipping PIP goal migration" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create PIP goal links
INSERT INTO pip_goal_links (
    id,
    pip_id,
    goal_id,
    goal_version_number,
    weightage_in_pip,
    is_active,
    linked_at,
    created_at
)
SELECT 
    UUID() as id,
    pip_id,
    id as goal_id,
    1 as goal_version_number,
    weightage as weightage_in_pip,
    TRUE as is_active,
    created_at as linked_at,
    created_at
FROM goals
WHERE pip_id IS NOT NULL
AND created_in_context = 'PIP'
AND NOT EXISTS (
    SELECT 1 FROM pip_goal_links 
    WHERE pip_goal_links.goal_id = goals.id
);

-- Create context links for PIP goals
INSERT INTO goal_context_links (
    id,
    goal_id,
    context,
    context_id,
    goal_version_number,
    weightage_in_context,
    is_snapshot,
    linked_at,
    created_at
)
SELECT 
    UUID() as id,
    id as goal_id,
    ''PIP'' as context,
    pip_id as context_id,
    1 as goal_version_number,
    weightage as weightage_in_context,
    FALSE as is_snapshot,
    created_at as linked_at,
    created_at
FROM goals
WHERE pip_id IS NOT NULL
AND created_in_context = 'PIP'
AND NOT EXISTS (
    SELECT 1 FROM goal_context_links 
    WHERE goal_context_links.goal_id = goals.id 
    AND goal_context_links.context = ''PIP''
);

-- =====================================================
-- Step 2: Migrate Appraisal Goals to Centralized Goals
-- =====================================================

INSERT INTO goals (
    id,
    employee_id,
    title,
    description,
    weightage,
    goal_type,
    success_criteria,
    status,
    target_date,
    version_number,
    is_current_version,
    created_in_context,
    created_in_context_id,
    is_locked,
    created_at,
    updated_at
)
SELECT 
    id,
    (SELECT employee_id FROM appraisal_participants WHERE appraisal_participants.id = appraisal_goals.participant_id LIMIT 1) as employee_id,
    title,
    description,
    weightage,
    goal_type,
    success_criteria,
    status,
    NULL as target_date,
    1 as version_number,
    TRUE as is_current_version,
    ''APPRAISAL'' as created_in_context,
    participant_id as created_in_context_id,
    FALSE as is_locked,
    created_at,
    updated_at
FROM appraisal_goals
WHERE participant_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM goals g2 
    WHERE g2.id = appraisal_goals.id 
    AND g2.created_in_context IS NOT NULL
);

-- Create context links for Appraisal goals
INSERT INTO goal_context_links (
    id,
    goal_id,
    context,
    context_id,
    goal_version_number,
    weightage_in_context,
    is_snapshot,
    linked_at,
    created_at
)
SELECT 
    UUID() as id,
    id as goal_id,
    ''APPRAISAL'' as context,
    participant_id as context_id,
    1 as goal_version_number,
    weightage as weightage_in_context,
    FALSE as is_snapshot,
    created_at as linked_at,
    created_at
FROM appraisal_goals
WHERE participant_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM goals 
    WHERE goals.id = appraisal_goals.id 
    AND goals.created_in_context = ''APPRAISAL''
)
AND NOT EXISTS (
    SELECT 1 FROM goal_context_links 
    WHERE goal_context_links.goal_id = appraisal_goals.id 
    AND goal_context_links.context = ''APPRAISAL''
);

-- =====================================================
-- Step 3: Create Initial Versions for Migrated Goals
-- =====================================================

INSERT INTO goal_versions (
    id,
    goal_id,
    version_number,
    title,
    description,
    weightage,
    success_criteria,
    target_date,
    change_reason,
    changed_by,
    created_at
)
SELECT 
    UUID() as id,
    id as goal_id,
    1 as version_number,
    title,
    description,
    weightage,
    success_criteria,
    target_date,
    ''Migrated from existing system'' as change_reason,
    COALESCE(created_by, ''SYSTEM'') as changed_by,
    created_at
FROM goals
WHERE version_number = 1
AND NOT EXISTS (
    SELECT 1 FROM goal_versions 
    WHERE goal_versions.goal_id = goals.id 
    AND goal_versions.version_number = 1
);

-- =====================================================
-- Step 4: Create Appraisal Snapshots (for active cycles)
-- =====================================================

INSERT INTO appraisal_goal_snapshots (
    id,
    appraisal_cycle_id,
    participant_id,
    goal_id,
    goal_version_number,
    title,
    description,
    weightage,
    success_criteria,
    target_date,
    snapshot_taken_at,
    snapshot_taken_by,
    created_at
)
SELECT 
    UUID() as id,
    (SELECT cycle_id FROM appraisal_participants WHERE appraisal_participants.id = goal_context_links.context_id LIMIT 1) as appraisal_cycle_id,
    goal_context_links.context_id as participant_id,
    goal_context_links.goal_id,
    goal_context_links.goal_version_number,
    goals.title,
    goals.description,
    goals.weightage,
    goals.success_criteria,
    goals.target_date,
    goal_context_links.linked_at as snapshot_taken_at,
    COALESCE(goal_context_links.created_by, ''SYSTEM'') as snapshot_taken_by,
    goal_context_links.created_at
FROM goal_context_links
JOIN goals ON goal_context_links.goal_id = goals.id
WHERE goal_context_links.context = ''APPRAISAL''
AND goal_context_links.is_snapshot = FALSE
AND EXISTS (
    SELECT 1 FROM appraisal_participants 
    WHERE appraisal_participants.id = goal_context_links.context_id
    AND EXISTS (
        SELECT 1 FROM appraisal_cycles 
        WHERE appraisal_cycles.id = appraisal_participants.cycle_id
        AND appraisal_cycles.status = ''ACTIVE''
    )
)
AND NOT EXISTS (
    SELECT 1 FROM appraisal_goal_snapshots 
    WHERE appraisal_goal_snapshots.goal_id = goal_context_links.goal_id
    AND appraisal_goal_snapshots.participant_id = goal_context_links.context_id
);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Step 5: Update Statistics
-- =====================================================

ANALYZE TABLE goals;
ANALYZE TABLE goal_versions;
ANALYZE TABLE goal_context_links;
ANALYZE TABLE pip_goal_links;
ANALYZE TABLE appraisal_goal_snapshots;

-- =====================================================
-- Migration Verification
-- =====================================================

SELECT 
    ''Migration completed successfully'' as status,
    (SELECT COUNT(*) FROM goals) as goals_count,
    (SELECT COUNT(*) FROM goal_versions) as versions_count,
    (SELECT COUNT(*) FROM goal_context_links) as context_links_count,
    (SELECT COUNT(*) FROM pip_goal_links) as pip_links_count,
    (SELECT COUNT(*) FROM appraisal_goal_snapshots) as snapshots_count,
    (SELECT COUNT(*) FROM goals WHERE created_in_context = ''PIP'') as pip_goals_count,
    (SELECT COUNT(*) FROM goals WHERE created_in_context = ''APPRAISAL'') as appraisal_goals_count;
