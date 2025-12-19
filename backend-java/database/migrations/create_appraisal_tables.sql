-- =====================================================
-- Annual Appraisal System - Database Schema Migration
-- =====================================================
-- This migration creates all tables for the Annual Appraisal System
-- Version: 1.0
-- Created: 2024
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS calibration_adjustments;
DROP TABLE IF EXISTS calibration_sessions;
DROP TABLE IF EXISTS appraisal_outcomes;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS review_responses;
DROP TABLE IF EXISTS review_forms;
DROP TABLE IF EXISTS review_phases;
DROP TABLE IF EXISTS appraisal_goals;
DROP TABLE IF EXISTS appraisal_participants;
DROP TABLE IF EXISTS appraisal_cycles;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Table: appraisal_cycles
-- Purpose: Stores appraisal cycle configurations
-- =====================================================
CREATE TABLE appraisal_cycles (
    id CHAR(36) PRIMARY KEY,
    cycle_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('DRAFT', 'ACTIVE', 'LOCKED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    description TEXT,
    eligibility_rules TEXT, -- JSON: departments, roles, grades, tenure cutoff, exclusions
    review_types TEXT, -- JSON: enabled review types
    rating_scale TEXT, -- JSON: scale type, min, max, labels
    forced_distribution_enabled BOOLEAN DEFAULT FALSE,
    forced_distribution_rules TEXT, -- JSON: bell curve percentages
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    locked_at TIMESTAMP NULL,
    
    -- Foreign keys
    CONSTRAINT fk_cycle_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_cycle_name (cycle_name),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: appraisal_participants
-- Purpose: Stores participants in each appraisal cycle
-- =====================================================
CREATE TABLE appraisal_participants (
    id CHAR(36) PRIMARY KEY,
    cycle_id CHAR(36) NOT NULL,
    employee_id CHAR(36) NOT NULL,
    manager_id CHAR(36) NOT NULL,
    skip_level_manager_id CHAR(36),
    hrbp_id CHAR(36),
    status ENUM('ELIGIBLE', 'IN_PROGRESS', 'GOALS_LOCKED', 'REVIEW_IN_PROGRESS', 
                'CALIBRATION_PENDING', 'CALIBRATED', 'OUTCOME_RELEASED', 
                'ACKNOWLEDGED', 'EXCLUDED') NOT NULL DEFAULT 'ELIGIBLE',
    eligibility_reason TEXT,
    goals_locked BOOLEAN DEFAULT FALSE,
    goals_locked_at TIMESTAMP NULL,
    self_review_submitted BOOLEAN DEFAULT FALSE,
    self_review_submitted_at TIMESTAMP NULL,
    manager_review_submitted BOOLEAN DEFAULT FALSE,
    manager_review_submitted_at TIMESTAMP NULL,
    skip_review_submitted BOOLEAN DEFAULT FALSE,
    skip_review_submitted_at TIMESTAMP NULL,
    calibrated BOOLEAN DEFAULT FALSE,
    calibrated_at TIMESTAMP NULL,
    final_outcome_released BOOLEAN DEFAULT FALSE,
    final_outcome_released_at TIMESTAMP NULL,
    employee_acknowledged BOOLEAN DEFAULT FALSE,
    employee_acknowledged_at TIMESTAMP NULL,
    employee_acknowledgement_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_participant_cycle FOREIGN KEY (cycle_id) REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
    CONSTRAINT fk_participant_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_participant_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_participant_skip_manager FOREIGN KEY (skip_level_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_participant_hrbp FOREIGN KEY (hrbp_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_cycle_id (cycle_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_manager_id (manager_id),
    INDEX idx_skip_manager_id (skip_level_manager_id),
    INDEX idx_hrbp_id (hrbp_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_cycle_employee (cycle_id, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: review_phases
-- Purpose: Stores review phases for each cycle
-- =====================================================
CREATE TABLE review_phases (
    id CHAR(36) PRIMARY KEY,
    cycle_id CHAR(36) NOT NULL,
    phase_type ENUM('GOAL_LOCK', 'SELF_REVIEW', 'MANAGER_REVIEW', 'SKIP_REVIEW', 
                    'PEER_REVIEW', 'CALIBRATION', 'HR_FINALIZATION', 
                    'EMPLOYEE_ACKNOWLEDGEMENT') NOT NULL,
    phase_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    buffer_days INT DEFAULT 0,
    auto_lock_after_deadline BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP NULL,
    sequence_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_phase_cycle FOREIGN KEY (cycle_id) REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_cycle_id (cycle_id),
    INDEX idx_phase_type (phase_type),
    INDEX idx_sequence_order (sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: appraisal_goals
-- Purpose: Stores goals for each participant
-- =====================================================
CREATE TABLE appraisal_goals (
    id CHAR(36) PRIMARY KEY,
    participant_id CHAR(36) NOT NULL,
    goal_type ENUM('BUSINESS_GOAL', 'BEHAVIORAL_GOAL', 'COMPETENCY_GOAL', 'OKR', 'DEVELOPMENT_GOAL') NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    weightage DOUBLE NOT NULL,
    success_criteria TEXT,
    status ENUM('ACTIVE', 'LOCKED', 'ACHIEVED', 'PARTIALLY_ACHIEVED', 'NOT_ACHIEVED') NOT NULL DEFAULT 'ACTIVE',
    source TEXT, -- JSON: imported from goal module, created during year, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_goal_participant FOREIGN KEY (participant_id) REFERENCES appraisal_participants(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_participant_id (participant_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: review_forms
-- Purpose: Stores review form templates
-- =====================================================
CREATE TABLE review_forms (
    id CHAR(36) PRIMARY KEY,
    cycle_id CHAR(36) NOT NULL,
    form_name VARCHAR(255) NOT NULL,
    review_type ENUM('SELF_REVIEW', 'MANAGER_REVIEW', 'SKIP_REVIEW', 'PEER_REVIEW', 'HR_REVIEW', 'CALIBRATION_REVIEW') NOT NULL,
    target_role VARCHAR(100), -- null = all roles
    target_department VARCHAR(100), -- null = all departments
    sections TEXT NOT NULL, -- JSON array of sections with questions
    is_active BOOLEAN DEFAULT TRUE,
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_form_cycle FOREIGN KEY (cycle_id) REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
    CONSTRAINT fk_form_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_cycle_id (cycle_id),
    INDEX idx_review_type (review_type),
    INDEX idx_target_role (target_role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: review_responses
-- Purpose: Stores submitted review responses
-- =====================================================
CREATE TABLE review_responses (
    id CHAR(36) PRIMARY KEY,
    participant_id CHAR(36) NOT NULL,
    form_id CHAR(36) NOT NULL,
    reviewer_id CHAR(36) NOT NULL,
    review_type ENUM('SELF_REVIEW', 'MANAGER_REVIEW', 'SKIP_REVIEW', 'PEER_REVIEW', 'HR_REVIEW', 'CALIBRATION_REVIEW') NOT NULL,
    responses TEXT NOT NULL, -- JSON: { sectionId: { questionId: answer } }
    status ENUM('DRAFT', 'SUBMITTED', 'LOCKED', 'AMENDED') NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMP NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_response_participant FOREIGN KEY (participant_id) REFERENCES appraisal_participants(id) ON DELETE CASCADE,
    CONSTRAINT fk_response_form FOREIGN KEY (form_id) REFERENCES review_forms(id) ON DELETE RESTRICT,
    CONSTRAINT fk_response_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_participant_id (participant_id),
    INDEX idx_form_id (form_id),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_review_type (review_type),
    INDEX idx_status (status),
    UNIQUE KEY unique_participant_review_type (participant_id, review_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: ratings
-- Purpose: Stores ratings from different sources
-- =====================================================
CREATE TABLE ratings (
    id CHAR(36) PRIMARY KEY,
    participant_id CHAR(36) NOT NULL,
    rating_source ENUM('SELF', 'MANAGER', 'SKIP_LEVEL', 'PEER', 'HR', 'CALIBRATED', 'FINAL') NOT NULL,
    rater_id CHAR(36) NOT NULL,
    rating_value DOUBLE NOT NULL,
    rating_label VARCHAR(100),
    section_ratings TEXT, -- JSON: { sectionId: rating }
    weighted_rating DOUBLE,
    is_calibrated BOOLEAN DEFAULT FALSE,
    calibrated_rating DOUBLE,
    calibration_reason TEXT,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_rating_participant FOREIGN KEY (participant_id) REFERENCES appraisal_participants(id) ON DELETE CASCADE,
    CONSTRAINT fk_rating_rater FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_participant_id (participant_id),
    INDEX idx_rating_source (rating_source),
    INDEX idx_rater_id (rater_id),
    INDEX idx_is_calibrated (is_calibrated),
    INDEX idx_is_final (is_final)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: calibration_sessions
-- Purpose: Stores calibration sessions
-- =====================================================
CREATE TABLE calibration_sessions (
    id CHAR(36) PRIMARY KEY,
    cycle_id CHAR(36) NOT NULL,
    session_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    team VARCHAR(100),
    status ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'LOCKED') NOT NULL DEFAULT 'DRAFT',
    forced_distribution_applied BOOLEAN DEFAULT FALSE,
    distribution_targets TEXT, -- JSON: { rating: percentage }
    actual_distribution TEXT, -- JSON: { rating: count, percentage }
    facilitated_by CHAR(36) NOT NULL,
    participants TEXT, -- JSON array of user IDs
    notes TEXT,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_calibration_cycle FOREIGN KEY (cycle_id) REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
    CONSTRAINT fk_calibration_facilitator FOREIGN KEY (facilitated_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_cycle_id (cycle_id),
    INDEX idx_department (department),
    INDEX idx_status (status),
    INDEX idx_facilitated_by (facilitated_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: calibration_adjustments
-- Purpose: Stores individual rating adjustments during calibration
-- =====================================================
CREATE TABLE calibration_adjustments (
    id CHAR(36) PRIMARY KEY,
    session_id CHAR(36) NOT NULL,
    participant_id CHAR(36) NOT NULL,
    original_rating DOUBLE NOT NULL,
    adjusted_rating DOUBLE NOT NULL,
    justification TEXT NOT NULL,
    adjusted_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_adjustment_session FOREIGN KEY (session_id) REFERENCES calibration_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_adjustment_participant FOREIGN KEY (participant_id) REFERENCES appraisal_participants(id) ON DELETE CASCADE,
    CONSTRAINT fk_adjustment_adjusted_by FOREIGN KEY (adjusted_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_session_id (session_id),
    INDEX idx_participant_id (participant_id),
    INDEX idx_adjusted_by (adjusted_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: appraisal_outcomes
-- Purpose: Stores final appraisal outcomes
-- =====================================================
CREATE TABLE appraisal_outcomes (
    id CHAR(36) PRIMARY KEY,
    participant_id CHAR(36) NOT NULL,
    final_rating DOUBLE NOT NULL,
    final_rating_label VARCHAR(100),
    promotion_recommendation BOOLEAN,
    bonus_percentage DOUBLE,
    hike_percentage DOUBLE,
    development_plan TEXT,
    pip_triggered BOOLEAN DEFAULT FALSE,
    pip_id CHAR(36), -- If PIP was auto-created
    summary TEXT,
    approved_by CHAR(36) NOT NULL,
    approved_at TIMESTAMP NOT NULL,
    released_to_employee BOOLEAN DEFAULT FALSE,
    released_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_outcome_participant FOREIGN KEY (participant_id) REFERENCES appraisal_participants(id) ON DELETE CASCADE,
    CONSTRAINT fk_outcome_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_outcome_pip FOREIGN KEY (pip_id) REFERENCES pips(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_participant_id (participant_id),
    INDEX idx_released_to_employee (released_to_employee),
    INDEX idx_approved_by (approved_by),
    INDEX idx_pip_triggered (pip_triggered),
    UNIQUE KEY unique_participant_outcome (participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

