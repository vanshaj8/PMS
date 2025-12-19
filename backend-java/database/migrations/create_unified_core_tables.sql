-- =====================================================
-- Unified Performance Management Platform
-- Core Layer Database Migration
-- =====================================================
-- This migration creates the unified core tables that support
-- both PIP and Appraisal modules
-- Version: 2.0
-- Created: 2024
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing core tables if they exist (for fresh setup)
DROP TABLE IF EXISTS goal_ratings;
DROP TABLE IF EXISTS workflow_steps;
DROP TABLE IF EXISTS workflow_phases;
DROP TABLE IF EXISTS unified_reviews;
DROP TABLE IF EXISTS shared_goals;
DROP TABLE IF EXISTS enhanced_audit_logs;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Table: workflow_phases
-- Purpose: Unified workflow phases for PIP and Appraisal
-- =====================================================
CREATE TABLE workflow_phases (
    id CHAR(36) PRIMARY KEY,
    workflow_id CHAR(36) NOT NULL,
    workflow_context ENUM('PIP', 'APPRAISAL', 'OKR', 'PROMOTION') NOT NULL,
    phase_name VARCHAR(255) NOT NULL,
    phase_key VARCHAR(100) NOT NULL,
    sequence_order INT NOT NULL,
    can_run_parallel BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    due_date DATE,
    buffer_days INT DEFAULT 0,
    auto_lock_after_deadline BOOLEAN DEFAULT TRUE,
    status ENUM('PENDING', 'IN_PROGRESS', 'DUE_SOON', 'OVERDUE', 'COMPLETED', 'SKIPPED', 'BLOCKED') NOT NULL DEFAULT 'PENDING',
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    assigned_role VARCHAR(50),
    assigned_user_id CHAR(36),
    metadata TEXT, -- JSON for phase-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version BIGINT DEFAULT 0,
    
    -- Indexes
    INDEX idx_workflow_id (workflow_id),
    INDEX idx_workflow_context (workflow_context),
    INDEX idx_phase_key (phase_key),
    INDEX idx_sequence_order (sequence_order),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_assigned_user_id (assigned_user_id),
    UNIQUE KEY unique_workflow_phase_key (workflow_id, phase_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: workflow_steps
-- Purpose: Individual steps within workflow phases
-- =====================================================
CREATE TABLE workflow_steps (
    id CHAR(36) PRIMARY KEY,
    phase_id CHAR(36) NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_key VARCHAR(100) NOT NULL,
    status ENUM('PENDING', 'IN_PROGRESS', 'DUE_SOON', 'OVERDUE', 'COMPLETED', 'SKIPPED', 'BLOCKED') NOT NULL DEFAULT 'PENDING',
    due_date DATE,
    completed_date DATE,
    completed_by CHAR(36),
    comments TEXT,
    metadata TEXT, -- JSON for step-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version BIGINT DEFAULT 0,
    
    -- Foreign keys
    CONSTRAINT fk_step_phase FOREIGN KEY (phase_id) REFERENCES workflow_phases(id) ON DELETE CASCADE,
    CONSTRAINT fk_step_completed_by FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_phase_id (phase_id),
    INDEX idx_step_key (step_key),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_completed_by (completed_by),
    UNIQUE KEY unique_phase_step_key (phase_id, step_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: shared_goals
-- Purpose: Unified goal entity - appraisal-first, referenced by PIP
-- =====================================================
CREATE TABLE shared_goals (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    weightage DOUBLE NOT NULL,
    goal_type ENUM('BUSINESS_GOAL', 'BEHAVIORAL_GOAL', 'COMPETENCY_GOAL', 'OKR', 'DEVELOPMENT_GOAL', 'PIP_IMPROVEMENT_GOAL') NOT NULL,
    success_criteria TEXT,
    status ENUM('ACTIVE', 'LOCKED', 'ACHIEVED', 'PARTIALLY_ACHIEVED', 'NOT_ACHIEVED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    target_date DATE,
    achieved_date DATE,
    version INT NOT NULL DEFAULT 1,
    parent_goal_id CHAR(36), -- For goal versioning
    source_context ENUM('PIP', 'APPRAISAL', 'OKR', 'PROMOTION'),
    source_id CHAR(36), -- PIP ID or AppraisalParticipant ID
    locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version_audit BIGINT DEFAULT 0,
    
    -- Foreign keys
    CONSTRAINT fk_goal_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_goal_parent FOREIGN KEY (parent_goal_id) REFERENCES shared_goals(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status),
    INDEX idx_source_context (source_context),
    INDEX idx_source_id (source_id),
    INDEX idx_parent_goal_id (parent_goal_id),
    INDEX idx_goal_type (goal_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: goal_ratings
-- Purpose: Ratings for individual goals
-- =====================================================
CREATE TABLE goal_ratings (
    id CHAR(36) PRIMARY KEY,
    goal_id CHAR(36) NOT NULL,
    rating_source ENUM('SELF', 'MANAGER', 'SKIP_LEVEL', 'PEER', 'HRBP', 'HR', 'CALIBRATED', 'FINAL') NOT NULL,
    rater_id CHAR(36) NOT NULL,
    rating_value DOUBLE NOT NULL,
    rating_label VARCHAR(100),
    comments TEXT,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version_audit BIGINT DEFAULT 0,
    
    -- Foreign keys
    CONSTRAINT fk_rating_goal FOREIGN KEY (goal_id) REFERENCES shared_goals(id) ON DELETE CASCADE,
    CONSTRAINT fk_rating_rater FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_goal_id (goal_id),
    INDEX idx_rating_source (rating_source),
    INDEX idx_rater_id (rater_id),
    INDEX idx_is_final (is_final)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: unified_reviews
-- Purpose: Unified review entity for all contexts
-- =====================================================
CREATE TABLE unified_reviews (
    id CHAR(36) PRIMARY KEY,
    review_context ENUM('PIP', 'APPRAISAL', 'OKR', 'PROMOTION') NOT NULL,
    context_id CHAR(36) NOT NULL,
    review_type ENUM('SELF_REVIEW', 'MANAGER_REVIEW', 'SKIP_REVIEW', 'PEER_REVIEW', 'HRBP_REVIEW', 'HR_REVIEW', 'CALIBRATION_REVIEW') NOT NULL,
    review_role ENUM('EMPLOYEE', 'MANAGER', 'SKIP_LEVEL_MANAGER', 'HRBP', 'HR', 'PEER', 'ADMIN') NOT NULL,
    reviewer_id CHAR(36) NOT NULL,
    reviewee_id CHAR(36) NOT NULL,
    form_id CHAR(36),
    responses TEXT NOT NULL, -- JSON: { sectionId: { questionId: answer } }
    status ENUM('DRAFT', 'SUBMITTED', 'LOCKED', 'AMENDED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMP NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP NULL,
    metadata TEXT, -- JSON for review-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version_audit BIGINT DEFAULT 0,
    
    -- Foreign keys
    CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_review_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_review_context (review_context),
    INDEX idx_context_id (context_id),
    INDEX idx_review_type (review_type),
    INDEX idx_review_role (review_role),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_reviewee_id (reviewee_id),
    INDEX idx_status (status),
    INDEX idx_form_id (form_id),
    UNIQUE KEY unique_context_review_type (review_context, context_id, review_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: enhanced_audit_logs
-- Purpose: Immutable audit logs with field-level tracking
-- =====================================================
CREATE TABLE enhanced_audit_logs (
    id CHAR(36) PRIMARY KEY,
    context ENUM('PIP', 'APPRAISAL', 'OKR', 'PROMOTION') NOT NULL,
    context_id CHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id CHAR(36),
    user_id CHAR(36) NOT NULL,
    user_role VARCHAR(50),
    field_changes TEXT, -- JSON: { field: { old: value, new: value } }
    override_reason TEXT, -- Mandatory for overrides
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    metadata TEXT, -- JSON for additional context
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_context (context),
    INDEX idx_context_id (context_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: No updated_at column - audit logs are immutable

