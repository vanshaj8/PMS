-- Migration: Add deadline fix columns to pips table
-- Date: December 2025
-- Description: Adds new columns for deadline calculation, timestamp tracking, and extension support

USE pip_management;

-- Add new timestamp columns for deadline calculation
-- Using stored procedure to check if columns exist first
DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_not_exists$$
CREATE PROCEDURE add_column_if_not_exists(
    IN table_name VARCHAR(64),
    IN column_name VARCHAR(64),
    IN column_definition TEXT
)
BEGIN
    DECLARE column_count INT;
    
    SELECT COUNT(*) INTO column_count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = table_name
        AND COLUMN_NAME = column_name;
    
    IF column_count = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', table_name, ' ADD COLUMN ', column_name, ' ', column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Add timestamp columns
CALL add_column_if_not_exists('pips', 'hrbp_approved_at', 'DATETIME NULL COMMENT ''When HRBP approved initial review''');
CALL add_column_if_not_exists('pips', 'employee_acknowledged_at', 'DATETIME NULL COMMENT ''When employee acknowledged''');
CALL add_column_if_not_exists('pips', 'active_period_started_at', 'DATETIME NULL COMMENT ''When active period actually started''');
CALL add_column_if_not_exists('pips', 'active_period_ended_at', 'DATETIME NULL COMMENT ''When active period ended''');
CALL add_column_if_not_exists('pips', 'self_review_submitted_at', 'DATETIME NULL COMMENT ''When employee submitted self-review''');
CALL add_column_if_not_exists('pips', 'manager_review_completed_at', 'DATETIME NULL COMMENT ''When manager completed review''');

-- Add extension tracking columns
CALL add_column_if_not_exists('pips', 'extension_count', 'INT DEFAULT 0 COMMENT ''Number of times PIP has been extended''');
CALL add_column_if_not_exists('pips', 'original_active_duration', 'INT NULL COMMENT ''Original duration before extensions''');

-- Add new duration columns to timeline
CALL add_column_if_not_exists('pips', 'employee_acknowledgement_duration', 'INT NULL COMMENT ''Days from HRBP approval''');
CALL add_column_if_not_exists('pips', 'self_review_buffer_duration', 'INT NULL COMMENT ''Days after active period ends''');
CALL add_column_if_not_exists('pips', 'manager_review_buffer_duration', 'INT NULL COMMENT ''Days after self-review''');
CALL add_column_if_not_exists('pips', 'hrbp_decision_buffer_duration', 'INT NULL COMMENT ''Days after manager review''');

-- Clean up procedure
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- Create deadline_policies table if it doesn't exist
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

-- Insert default policy
INSERT INTO deadline_policies (
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
) ON DUPLICATE KEY UPDATE policy_name = policy_name;

-- Verify migration
SELECT 
    'Migration completed successfully' AS status,
    COUNT(*) AS columns_added
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'pip_management' 
    AND TABLE_NAME = 'pips'
    AND COLUMN_NAME IN (
        'hrbp_approved_at',
        'employee_acknowledged_at',
        'active_period_started_at',
        'active_period_ended_at',
        'self_review_submitted_at',
        'manager_review_completed_at',
        'extension_count',
        'original_active_duration'
    );

