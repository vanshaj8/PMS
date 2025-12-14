-- =====================================================
-- PIP Management System - MySQL Database Schema
-- =====================================================
-- Database: pip_management
-- Version: 1.0
-- Created: 2024
-- =====================================================

-- Create Database (run this first)
-- CREATE DATABASE IF NOT EXISTS pip_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE pip_management;

-- =====================================================
-- Table: users
-- Purpose: Stores all user accounts (employees, managers, HRBP, admins)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'EMPLOYEE', 'HRBP', 'EXECUTIVE') NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    manager_id VARCHAR(36),
    hrbp_id VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_manager_id (manager_id),
    INDEX idx_hrbp_id (hrbp_id),
    INDEX idx_is_active (is_active),
    
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (hrbp_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: pips
-- Purpose: Main table for Performance Improvement Plans
-- =====================================================
CREATE TABLE IF NOT EXISTS pips (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    manager_id VARCHAR(36) NOT NULL,
    hrbp_id VARCHAR(36) NOT NULL,
    reason TEXT,
    supporting_documents TEXT, -- JSON array of document URLs/paths
    status ENUM(
        'DRAFT',
        'PENDING_HRBP_REVIEW',
        'PENDING_EMPLOYEE_ACKNOWLEDGEMENT',
        'ACTIVE',
        'PENDING_EMPLOYEE_SELF_REVIEW',
        'PENDING_MANAGER_REVIEW',
        'PENDING_HRBP_DECISION',
        'COMPLETED',
        'OVERDUE',
        'CANCELLED'
    ) NOT NULL DEFAULT 'DRAFT',
    final_outcome ENUM('SUCCESSFUL', 'UNSUCCESSFUL', 'EXTENDED', 'CLOSED_WITHOUT_ACTION'),
    final_remarks TEXT,
    locked BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 1,
    
    -- Timeline fields (embedded from PIPTimeline)
    employee_acknowledgement_deadline DATE,
    pip_active_duration INT, -- in days
    employee_self_review_deadline DATE,
    manager_final_review_deadline DATE,
    hrbp_final_decision_deadline DATE,
    grace_period INT DEFAULT 0, -- in days
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_manager_id (manager_id),
    INDEX idx_hrbp_id (hrbp_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_employee_acknowledgement_deadline (employee_acknowledgement_deadline),
    INDEX idx_employee_self_review_deadline (employee_self_review_deadline),
    
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (hrbp_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: goals
-- Purpose: Stores individual goals within a PIP
-- =====================================================
CREATE TABLE IF NOT EXISTS goals (
    id VARCHAR(36) PRIMARY KEY,
    pip_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    weightage DECIMAL(5,2) NOT NULL, -- e.g., 30.00 for 30%
    expected_outcome VARCHAR(500),
    target_timeline VARCHAR(100),
    deadline DATE,
    justification TEXT, -- Employee's justification during self-review
    employee_attachments TEXT, -- JSON array of document URLs/paths
    status ENUM('ACHIEVED', 'PARTIALLY_ACHIEVED', 'NOT_ACHIEVED') DEFAULT 'NOT_ACHIEVED',
    manager_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pip_id (pip_id),
    INDEX idx_status (status),
    INDEX idx_deadline (deadline),
    
    FOREIGN KEY (pip_id) REFERENCES pips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: pip_steps
-- Purpose: Tracks workflow steps and their status for each PIP
-- =====================================================
CREATE TABLE IF NOT EXISTS pip_steps (
    id VARCHAR(36) PRIMARY KEY,
    pip_id VARCHAR(36) NOT NULL,
    step ENUM(
        'EMPLOYEE_ACKNOWLEDGEMENT',
        'ACTIVE_PIP',
        'EMPLOYEE_SELF_REVIEW',
        'MANAGER_REVIEW',
        'HRBP_DECISION',
        'HRBP_REVIEW'
    ) NOT NULL,
    status ENUM('PENDING', 'DUE_SOON', 'OVERDUE', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    completed_date DATE,
    comments TEXT,
    signed_by VARCHAR(36), -- User ID who signed/completed this step
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pip_id (pip_id),
    INDEX idx_step (step),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_signed_by (signed_by),
    
    FOREIGN KEY (pip_id) REFERENCES pips(id) ON DELETE CASCADE,
    FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: check_ins
-- Purpose: Stores progress check-ins during active PIP period
-- =====================================================
CREATE TABLE IF NOT EXISTS check_ins (
    id VARCHAR(36) PRIMARY KEY,
    pip_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    attachments TEXT, -- JSON array of document URLs/paths
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_pip_id (pip_id),
    INDEX idx_date (date),
    
    FOREIGN KEY (pip_id) REFERENCES pips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: audit_logs
-- Purpose: Tracks all important actions and changes in the system
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'PIP', 'GOAL', 'USER'
    entity_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'
    user_id VARCHAR(36),
    user_email VARCHAR(255),
    old_values JSON, -- Previous state (for updates)
    new_values JSON, -- New state
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: notifications
-- Purpose: Stores system notifications for users
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO', -- INFO, WARNING, ERROR, SUCCESS
    read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500), -- URL to navigate when notification is clicked
    related_entity_type VARCHAR(50), -- e.g., 'PIP'
    related_entity_id VARCHAR(36), -- e.g., PIP ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_read (read),
    INDEX idx_created_at (created_at),
    INDEX idx_user_read (user_id, read),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: timeline_overrides
-- Purpose: Tracks timeline changes made by admins
-- =====================================================
CREATE TABLE IF NOT EXISTS timeline_overrides (
    id VARCHAR(36) PRIMARY KEY,
    pip_id VARCHAR(36) NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    original_deadline DATE NOT NULL,
    new_deadline DATE NOT NULL,
    reason TEXT NOT NULL,
    overridden_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_pip_id (pip_id),
    INDEX idx_overridden_by (overridden_by),
    
    FOREIGN KEY (pip_id) REFERENCES pips(id) ON DELETE CASCADE,
    FOREIGN KEY (overridden_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: goal_library (Optional - for reusable goals)
-- Purpose: Stores template goals that can be reused
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_library (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_by VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: pip_templates (Optional - for reusable PIP templates)
-- Purpose: Stores PIP templates for quick creation
-- =====================================================
CREATE TABLE IF NOT EXISTS pip_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goals JSON, -- Array of goal templates
    timeline_config JSON, -- Timeline configuration
    created_by VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active),
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
