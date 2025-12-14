-- =====================================================
-- PIP Management System - MySQL Database Schema
-- =====================================================
-- Database: pip_management
-- Version: 1.0
-- Created: 2024
-- =====================================================

-- Drop existing tables if they exist (for fresh setup)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS check_ins;
DROP TABLE IF EXISTS pip_steps;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS pips;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Table: users
-- Purpose: Stores all user accounts (employees, managers, HRBP, admins)
-- =====================================================
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'EMPLOYEE', 'HRBP', 'EXECUTIVE') NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    manager_id CHAR(36),
    hrbp_id CHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_user_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_user_hrbp FOREIGN KEY (hrbp_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_manager_id (manager_id),
    INDEX idx_hrbp_id (hrbp_id),
    INDEX idx_is_active (is_active),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: pips
-- Purpose: Stores Performance Improvement Plans
-- =====================================================
CREATE TABLE pips (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36) NOT NULL,
    manager_id CHAR(36) NOT NULL,
    hrbp_id CHAR(36) NOT NULL,
    reason TEXT,
    supporting_documents TEXT, -- JSON array as string
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
    pip_active_duration INT, -- days
    employee_self_review_deadline DATE,
    manager_final_review_deadline DATE,
    hrbp_final_decision_deadline DATE,
    grace_period INT, -- days
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_pip_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pip_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pip_hrbp FOREIGN KEY (hrbp_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_employee_id (employee_id),
    INDEX idx_manager_id (manager_id),
    INDEX idx_hrbp_id (hrbp_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_final_outcome (final_outcome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: goals
-- Purpose: Stores individual goals within a PIP
-- =====================================================
CREATE TABLE goals (
    id CHAR(36) PRIMARY KEY,
    pip_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    weightage DECIMAL(5,2) NOT NULL, -- e.g., 30.50 for 30.5%
    expected_outcome TEXT,
    target_timeline VARCHAR(100),
    deadline DATE,
    justification TEXT,
    employee_attachments TEXT, -- JSON array as string
    status ENUM('ACHIEVED', 'PARTIALLY_ACHIEVED', 'NOT_ACHIEVED') DEFAULT 'NOT_ACHIEVED',
    manager_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_goal_pip FOREIGN KEY (pip_id) REFERENCES pips(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_pip_id (pip_id),
    INDEX idx_status (status),
    
    -- Constraints
    CONSTRAINT chk_weightage CHECK (weightage >= 0 AND weightage <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: pip_steps
-- Purpose: Tracks workflow steps and their status
-- =====================================================
CREATE TABLE pip_steps (
    id CHAR(36) PRIMARY KEY,
    pip_id CHAR(36) NOT NULL,
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
    signed_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_step_pip FOREIGN KEY (pip_id) REFERENCES pips(id) ON DELETE CASCADE,
    CONSTRAINT fk_step_signed_by FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_pip_id (pip_id),
    INDEX idx_step (step),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_signed_by (signed_by),
    
    -- Unique constraint: one step type per PIP
    UNIQUE KEY uk_pip_step (pip_id, step)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: check_ins
-- Purpose: Stores progress check-ins during active PIP period
-- =====================================================
CREATE TABLE check_ins (
    id CHAR(36) PRIMARY KEY,
    pip_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    attachments TEXT, -- JSON array as string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_checkin_pip FOREIGN KEY (pip_id) REFERENCES pips(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_pip_id (pip_id),
    INDEX idx_date (date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Optional: Audit Log Table (for tracking all changes)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'PIP', 'GOAL', 'USER'
    entity_id CHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE'
    user_id CHAR(36),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Sample Data Inserts
-- =====================================================

-- Insert default users
INSERT INTO users (id, email, password, first_name, last_name, role, department, location, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'User', 'ADMIN', 'IT', 'Headquarters', TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'manager@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Manager', 'User', 'MANAGER', 'Engineering', 'New York', TRUE),
('550e8400-e29b-41d4-a716-446655440003', 'employee@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Employee', 'User', 'EMPLOYEE', 'Engineering', 'New York', TRUE),
('550e8400-e29b-41d4-a716-446655440004', 'hrbp@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'HRBP', 'User', 'HRBP', 'HR', 'Headquarters', TRUE),
('550e8400-e29b-41d4-a716-446655440005', 'executive@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Executive', 'User', 'EXECUTIVE', 'Executive', 'Headquarters', TRUE);

-- Update manager and HRBP relationships
UPDATE users SET manager_id = '550e8400-e29b-41d4-a716-446655440002' WHERE id = '550e8400-e29b-41d4-a716-446655440003';
UPDATE users SET hrbp_id = '550e8400-e29b-41d4-a716-446655440004' WHERE id = '550e8400-e29b-41d4-a716-446655440003';

-- Note: Password hash above is for 'password123' - CHANGE IN PRODUCTION!
