-- =====================================================
-- PIP Management System - Sample Data
-- =====================================================
-- This file contains sample data for testing and development
-- =====================================================

USE pip_management;

-- =====================================================
-- Sample Users
-- =====================================================
-- Note: Passwords are hashed with BCrypt
-- Default password for all: "password123"
-- BCrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO users (id, email, password, first_name, last_name, role, department, location, is_active, created_at, updated_at) VALUES
('admin-001', 'admin@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'User', 'ADMIN', 'IT', 'New York', TRUE, NOW(), NOW()),
('manager-001', 'manager@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John', 'Manager', 'MANAGER', 'Engineering', 'New York', TRUE, NOW(), NOW()),
('employee-001', 'employee@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jane', 'Employee', 'EMPLOYEE', 'Engineering', 'New York', TRUE, NOW(), NOW()),
('hrbp-001', 'hrbp@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sarah', 'HRBP', 'HRBP', 'HR', 'New York', TRUE, NOW(), NOW()),
('executive-001', 'executive@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Michael', 'Executive', 'EXECUTIVE', 'Executive', 'New York', TRUE, NOW(), NOW());

-- Update manager and HRBP relationships
UPDATE users SET manager_id = 'manager-001', hrbp_id = 'hrbp-001' WHERE id = 'employee-001';

-- =====================================================
-- Sample PIP
-- =====================================================
INSERT INTO pips (
    id, employee_id, manager_id, hrbp_id, reason, status,
    employee_acknowledgement_deadline, pip_active_duration,
    employee_self_review_deadline, manager_final_review_deadline,
    hrbp_final_decision_deadline, grace_period,
    created_at, updated_at
) VALUES (
    'pip-001',
    'employee-001',
    'manager-001',
    'hrbp-001',
    'Performance improvement needed in code quality and meeting deadlines. Multiple bugs reported in recent releases.',
    'PENDING_EMPLOYEE_ACKNOWLEDGEMENT',
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    90,
    DATE_ADD(NOW(), INTERVAL 97 DAY),
    DATE_ADD(NOW(), INTERVAL 107 DAY),
    DATE_ADD(NOW(), INTERVAL 120 DAY),
    3,
    NOW(),
    NOW()
);

-- =====================================================
-- Sample Goals
-- =====================================================
INSERT INTO goals (id, pip_id, title, description, weightage, expected_outcome, target_timeline, deadline, status, created_at, updated_at) VALUES
('goal-001', 'pip-001', 'Improve Code Quality', 'Reduce bugs by 50% in production releases. Implement code review process and unit testing.', 40.00, 'Zero critical bugs in production for 3 consecutive releases', '3 months', DATE_ADD(NOW(), INTERVAL 90 DAY), 'NOT_ACHIEVED', NOW(), NOW()),
('goal-002', 'pip-001', 'Meet Project Deadlines', 'Complete all assigned tasks on time. Improve time estimation skills.', 35.00, '100% on-time delivery for next 3 sprints', '3 months', DATE_ADD(NOW(), INTERVAL 90 DAY), 'NOT_ACHIEVED', NOW(), NOW()),
('goal-003', 'pip-001', 'Improve Communication', 'Provide regular status updates and proactively communicate blockers.', 25.00, 'No missed status updates and proactive communication of issues', '3 months', DATE_ADD(NOW(), INTERVAL 90 DAY), 'NOT_ACHIEVED', NOW(), NOW());

-- =====================================================
-- Sample PIP Steps
-- =====================================================
INSERT INTO pip_steps (id, pip_id, step, status, due_date, created_at, updated_at) VALUES
('step-001', 'pip-001', 'EMPLOYEE_ACKNOWLEDGEMENT', 'PENDING', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW()),
('step-002', 'pip-001', 'ACTIVE_PIP', 'PENDING', DATE_ADD(NOW(), INTERVAL 8 DAY), NOW(), NOW()),
('step-003', 'pip-001', 'EMPLOYEE_SELF_REVIEW', 'PENDING', DATE_ADD(NOW(), INTERVAL 97 DAY), NOW(), NOW()),
('step-004', 'pip-001', 'MANAGER_REVIEW', 'PENDING', DATE_ADD(NOW(), INTERVAL 107 DAY), NOW(), NOW()),
('step-005', 'pip-001', 'HRBP_DECISION', 'PENDING', DATE_ADD(NOW(), INTERVAL 120 DAY), NOW(), NOW());

-- =====================================================
-- Sample Check-In
-- =====================================================
INSERT INTO check_ins (id, pip_id, date, notes, created_at) VALUES
('checkin-001', 'pip-001', CURDATE(), 'Initial check-in. Discussed goals and expectations. Employee understands requirements.', NOW());

-- =====================================================
-- Sample Notification
-- =====================================================
INSERT INTO notifications (id, user_id, title, message, type, read, action_url, related_entity_type, related_entity_id, created_at) VALUES
('notif-001', 'employee-001', 'New PIP Created', 'A new Performance Improvement Plan has been created for you. Please review and acknowledge.', 'INFO', FALSE, '/pips/pip-001', 'PIP', 'pip-001', NOW());

-- =====================================================
-- Sample Audit Log
-- =====================================================
INSERT INTO audit_logs (entity_type, entity_id, action, user_id, user_email, description, created_at) VALUES
('PIP', 'pip-001', 'CREATE', 'manager-001', 'manager@pip.com', 'Created new PIP for employee employee@pip.com', NOW());
