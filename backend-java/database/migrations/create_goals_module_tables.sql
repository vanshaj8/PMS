-- =====================================================
-- Centralized Goals Module - Database Schema
-- =====================================================
-- This migration creates the Goals module tables
-- Goals are the single source of truth, referenced by PIP and Appraisal
-- Version: 2.1
-- Created: 2024
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS appraisal_goal_snapshots;
DROP TABLE IF EXISTS pip_goal_links;
DROP TABLE IF EXISTS goal_context_links;
DROP TABLE IF EXISTS goal_versions;
DROP TABLE IF EXISTS goals;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Table: goals
-- Purpose: Centralized goal entity - single source of truth
-- =====================================================
CREATE TABLE goals (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    weightage DOUBLE NOT NULL,
    goal_type ENUM('BUSINESS_GOAL', 'BEHAVIORAL_GOAL', 'COMPETENCY_GOAL', 'OKR', 'DEVELOPMENT_GOAL', 'PIP_IMPROVEMENT_GOAL') NOT NULL,
    success_criteria TEXT,
    status ENUM('ACTIVE', 'LOCKED', 'ACHIEVED', 'PARTIALLY_ACHIEVED', 'NOT_ACHIEVED', 'CANCELLED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    target_date DATE,
    achieved_date DATE,
    
    -- Versioning
    version_number INT NOT NULL DEFAULT 1,
    previous_version_id CHAR(36), -- Links to previous version
    is_current_version BOOLEAN DEFAULT TRUE,
    
    -- Context tracking
    created_in_context VARCHAR(50), -- PIP, APPRAISAL, MANUAL
    created_in_context_id CHAR(36),
    
    -- Locking
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP NULL,
    locked_by CHAR(36),
    lock_reason TEXT,
    
    -- Metadata
    metadata TEXT, -- JSON for additional data
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version_audit BIGINT DEFAULT 0,
    
    -- Foreign keys
    CONSTRAINT fk_goal_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_goal_previous_version FOREIGN KEY (previous_version_id) REFERENCES goals(id) ON DELETE SET NULL,
    CONSTRAINT fk_goal_locked_by FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status),
    INDEX idx_is_current_version (is_current_version),
    INDEX idx_previous_version_id (previous_version_id),
    INDEX idx_created_in_context (created_in_context),
    INDEX idx_created_in_context_id (created_in_context_id),
    INDEX idx_is_locked (is_locked),
    INDEX idx_goal_type (goal_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: goal_versions
-- Purpose: Immutable version history of goals
-- =====================================================
CREATE TABLE goal_versions (
    id CHAR(36) PRIMARY KEY,
    goal_id CHAR(36) NOT NULL,
    version_number INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    weightage DOUBLE NOT NULL,
    success_criteria TEXT,
    target_date DATE,
    changed_fields TEXT, -- JSON: { field: { old: value, new: value } }
    change_reason TEXT,
    changed_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version_audit BIGINT DEFAULT 0,
    
    -- Foreign keys
    CONSTRAINT fk_version_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    CONSTRAINT fk_version_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_goal_id (goal_id),
    INDEX idx_version_number (version_number),
    UNIQUE KEY unique_goal_version (goal_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: goal_context_links
-- Purpose: Links goals to contexts (PIP, Appraisal, etc.)
-- =====================================================
CREATE TABLE goal_context_links (
    id CHAR(36) PRIMARY KEY,
    goal_id CHAR(36) NOT NULL,
    context ENUM('PIP', 'APPRAISAL', 'OKR', 'PROMOTION') NOT NULL,
    context_id CHAR(36) NOT NULL,
    goal_version_number INT NOT NULL,
    weightage_in_context DOUBLE,
    is_snapshot BOOLEAN DEFAULT FALSE,
    snapshot_taken_at TIMESTAMP NULL,
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version_audit BIGINT DEFAULT 0,
    
    -- Foreign keys
    CONSTRAINT fk_context_link_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_goal_id (goal_id),
    INDEX idx_context (context),
    INDEX idx_context_id (context_id),
    INDEX idx_is_snapshot (is_snapshot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: pip_goal_links
-- Purpose: Links goals to PIPs (direct reference)
-- =====================================================
CREATE TABLE pip_goal_links (
    id CHAR(36) PRIMARY KEY,
    pip_id CHAR(36) NOT NULL,
    goal_id CHAR(36) NOT NULL,
    goal_version_number INT NOT NULL,
    weightage_in_pip DOUBLE,
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version_audit BIGINT DEFAULT 0,
    
    -- Foreign keys
    CONSTRAINT fk_pip_link_pip FOREIGN KEY (pip_id) REFERENCES pips(id) ON DELETE CASCADE,
    CONSTRAINT fk_pip_link_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_pip_id (pip_id),
    INDEX idx_goal_id (goal_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: appraisal_goal_snapshots
-- Purpose: Immutable snapshot of goals at Appraisal cycle start
-- =====================================================
CREATE TABLE appraisal_goal_snapshots (
    id CHAR(36) PRIMARY KEY,
    appraisal_cycle_id CHAR(36) NOT NULL,
    participant_id CHAR(36) NOT NULL,
    goal_id CHAR(36) NOT NULL,
    goal_version_number INT NOT NULL,
    
    -- Snapshot data (immutable copy)
    title VARCHAR(500) NOT NULL,
    description TEXT,
    weightage DOUBLE NOT NULL,
    success_criteria TEXT,
    target_date DATE,
    
    snapshot_taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    snapshot_taken_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version_audit BIGINT DEFAULT 0,
    
    -- Foreign keys
    -- Note: Foreign keys to appraisal_cycles and appraisal_participants are commented out
    -- as these tables may not exist yet. Add them later when appraisal tables are created.
    -- CONSTRAINT fk_snapshot_cycle FOREIGN KEY (appraisal_cycle_id) REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
    -- CONSTRAINT fk_snapshot_participant FOREIGN KEY (participant_id) REFERENCES appraisal_participants(id) ON DELETE CASCADE,
    CONSTRAINT fk_snapshot_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE RESTRICT,
    CONSTRAINT fk_snapshot_taken_by FOREIGN KEY (snapshot_taken_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_cycle_id (appraisal_cycle_id),
    INDEX idx_participant_id (participant_id),
    INDEX idx_goal_id (goal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

