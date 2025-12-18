-- Migration: Add deadline fix columns to pips table (Simple Version)
-- Date: December 2025
-- Description: Adds new columns for deadline calculation, timestamp tracking, and extension support

USE pip_management;

-- Add new timestamp columns for deadline calculation
ALTER TABLE pips 
ADD COLUMN hrbp_approved_at DATETIME NULL COMMENT 'When HRBP approved initial review',
ADD COLUMN employee_acknowledged_at DATETIME NULL COMMENT 'When employee acknowledged',
ADD COLUMN active_period_started_at DATETIME NULL COMMENT 'When active period actually started',
ADD COLUMN active_period_ended_at DATETIME NULL COMMENT 'When active period ended',
ADD COLUMN self_review_submitted_at DATETIME NULL COMMENT 'When employee submitted self-review',
ADD COLUMN manager_review_completed_at DATETIME NULL COMMENT 'When manager completed review';

-- Add extension tracking columns
ALTER TABLE pips
ADD COLUMN extension_count INT DEFAULT 0 COMMENT 'Number of times PIP has been extended',
ADD COLUMN original_active_duration INT NULL COMMENT 'Original duration before extensions';

-- Add new duration columns to timeline
ALTER TABLE pips
ADD COLUMN employee_acknowledgement_duration INT NULL COMMENT 'Days from HRBP approval',
ADD COLUMN self_review_buffer_duration INT NULL COMMENT 'Days after active period ends',
ADD COLUMN manager_review_buffer_duration INT NULL COMMENT 'Days after self-review',
ADD COLUMN hrbp_decision_buffer_duration INT NULL COMMENT 'Days after manager review';

-- Create deadline_policies table
CREATE TABLE IF NOT EXISTS deadline_policies (
    id CHAR(36) PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL UNIQUE,
    
    -- HRBP Review
    hrbp_review_min_days INT DEFAULT 2,
    hrbp_review_max_days INT DEFAULT 5,
    hrbp_review_default_days INT DEFAULT 3,
    hrbp_review_business_days_only BOOLEAN DEFAULT TRUE,
    
    -- Employee Acknowledgement
    employee_ack_min_days INT DEFAULT 3,
    employee_ack_max_days INT DEFAULT 7,
    employee_ack_default_days INT DEFAULT 5,
    employee_ack_business_days_only BOOLEAN DEFAULT TRUE,
    
    -- Active Duration
    active_duration_min_days INT DEFAULT 30,
    active_duration_max_days INT DEFAULT 90,
    active_duration_default_days INT DEFAULT 50,
    active_duration_business_days_only BOOLEAN DEFAULT FALSE,
    
    -- Self-Review Buffer
    self_review_buffer_min_days INT DEFAULT 1,
    self_review_buffer_max_days INT DEFAULT 5,
    self_review_buffer_default_days INT DEFAULT 3,
    self_review_buffer_business_days_only BOOLEAN DEFAULT TRUE,
    
    -- Manager Review Buffer
    manager_review_buffer_min_days INT DEFAULT 3,
    manager_review_buffer_max_days INT DEFAULT 7,
    manager_review_buffer_default_days INT DEFAULT 5,
    manager_review_buffer_business_days_only BOOLEAN DEFAULT TRUE,
    
    -- HRBP Decision Buffer
    hrbp_decision_buffer_min_days INT DEFAULT 3,
    hrbp_decision_buffer_max_days INT DEFAULT 7,
    hrbp_decision_buffer_default_days INT DEFAULT 5,
    hrbp_decision_buffer_business_days_only BOOLEAN DEFAULT TRUE,
    
    -- Grace Period
    grace_period_days INT DEFAULT 2,
    grace_period_business_days_only BOOLEAN DEFAULT TRUE,
    
    -- Check-In Requirements
    min_check_in_frequency_days INT DEFAULT 7,
    min_check_ins_required INT DEFAULT 3,
    
    -- Extension Policy
    max_extensions_allowed INT DEFAULT 1,
    max_total_pip_duration_days INT DEFAULT 120,
    
    -- Escalation Thresholds
    escalation_to_hrbp_days INT DEFAULT 3,
    escalation_to_admin_days INT DEFAULT 7,
    
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default policy (ignore if exists)
INSERT IGNORE INTO deadline_policies (
    id, policy_name,
    hrbp_review_min_days, hrbp_review_max_days, hrbp_review_default_days,
    employee_ack_min_days, employee_ack_max_days, employee_ack_default_days,
    active_duration_min_days, active_duration_max_days, active_duration_default_days,
    self_review_buffer_min_days, self_review_buffer_max_days, self_review_buffer_default_days,
    manager_review_buffer_min_days, manager_review_buffer_max_days, manager_review_buffer_default_days,
    hrbp_decision_buffer_min_days, hrbp_decision_buffer_max_days, hrbp_decision_buffer_default_days,
    grace_period_days,
    min_check_in_frequency_days, min_check_ins_required,
    max_extensions_allowed, max_total_pip_duration_days,
    escalation_to_hrbp_days, escalation_to_admin_days,
    active
) VALUES (
    UUID(), 'STANDARD_PIP',
    2, 5, 3,
    3, 7, 5,
    30, 90, 50,
    1, 5, 3,
    3, 7, 5,
    3, 7, 5,
    2,
    7, 3,
    1, 120,
    3, 7,
    TRUE
);

-- Update PIP status enum to include new statuses
ALTER TABLE pips MODIFY COLUMN status ENUM(
    'DRAFT',
    'PENDING_HRBP_REVIEW',
    'PENDING_EMPLOYEE_ACKNOWLEDGEMENT',
    'OVERDUE_EMPLOYEE_ACKNOWLEDGEMENT',
    'ACTIVE',
    'ACTIVE_PENDING_VALIDATION',
    'PENDING_EMPLOYEE_SELF_REVIEW',
    'PENDING_MANAGER_REVIEW',
    'OVERDUE_MANAGER_REVIEW',
    'PENDING_HRBP_DECISION',
    'OVERDUE_HRBP_DECISION',
    'ADMIN_INTERVENTION_REQUIRED',
    'COMPLETED',
    'OVERDUE',
    'CANCELLED',
    'DEEMED_ACKNOWLEDGED'
) NOT NULL DEFAULT 'DRAFT';

SELECT 'Migration completed successfully' AS status;

