-- =====================================================
-- Test PIP Case: Ready for Manager Review
-- This PIP has completed all steps up to Manager Review
-- Status: PENDING_MANAGER_REVIEW
-- =====================================================

-- Get user IDs
SET @employee_id = (SELECT id FROM users WHERE email = 'alex.miller@pip.com' LIMIT 1);
SET @manager_id = (SELECT id FROM users WHERE email = 'sarah.chen@pip.com' LIMIT 1);
SET @hrbp_id = (SELECT id FROM users WHERE email = 'patricia.martinez@pip.com' LIMIT 1);

-- Create PIP
SET @pip_id = UUID();
SET @created_date = DATE_SUB(CURDATE(), INTERVAL 60 DAY); -- PIP created 60 days ago
SET @ack_date = DATE_SUB(CURDATE(), INTERVAL 55 DAY); -- Acknowledged 55 days ago
SET @active_end = DATE_SUB(CURDATE(), INTERVAL 5 DAY); -- Active period ended 5 days ago
SET @self_review_date = DATE_SUB(CURDATE(), INTERVAL 3 DAY); -- Self-review completed 3 days ago
SET @manager_review_due = DATE_ADD(CURDATE(), INTERVAL 2 DAY); -- Manager review due in 2 days

INSERT INTO pips (
    id,
    employee_id,
    manager_id,
    hrbp_id,
    reason,
    supporting_documents,
    status,
    locked,
    version,
    employee_acknowledgement_deadline,
    pip_active_duration,
    employee_self_review_deadline,
    manager_final_review_deadline,
    hrbp_final_decision_deadline,
    created_at,
    updated_at
) VALUES (
    @pip_id,
    @employee_id,
    @manager_id,
    @hrbp_id,
    'Performance issues identified in Q4 2024. Employee has shown consistent delays in project deliverables and missed several critical deadlines. Customer feedback indicates concerns about response times and quality of work.',
    '["performance_review_q4.pdf", "customer_feedback_dec_2024.pdf", "project_timeline_issues.xlsx"]',
    'PENDING_MANAGER_REVIEW',
    FALSE,
    1,
    @ack_date,
    50, -- 50 days active duration
    @self_review_date,
    @manager_review_due,
    DATE_ADD(@manager_review_due, INTERVAL 5 DAY),
    @created_date,
    NOW()
);

-- Create Goals (3 goals with employee responses)
SET @goal1_id = UUID();
SET @goal2_id = UUID();
SET @goal3_id = UUID();

INSERT INTO goals (id, pip_id, title, description, weightage, expected_outcome, target_timeline, deadline, justification, employee_attachments, status, manager_comments, created_at, updated_at) VALUES
(
    @goal1_id,
    @pip_id,
    'Improve Project Delivery Timeliness',
    'Complete all assigned projects within the agreed-upon deadlines. Reduce project delays by 90% compared to previous quarter.',
    35.00,
    'All projects delivered on time with zero critical delays. Project completion rate of 100% within deadline.',
    '4 weeks',
    DATE_SUB(CURDATE(), INTERVAL 10 DAY),
    'Employee has provided detailed action plan including: 1) Daily standup meetings with team, 2) Use of project management tools for tracking, 3) Early escalation of blockers, 4) Time management training completed.',
    '["action_plan.pdf", "training_certificate.pdf"]',
    'PARTIALLY_ACHIEVED',
    NULL, -- Manager will add comments during review
    @created_date,
    NOW()
),
(
    @goal2_id,
    @pip_id,
    'Enhance Code Quality and Reduce Bugs',
    'Improve code quality metrics: reduce bug count by 70%, increase code review scores to above 4.0/5.0, implement unit tests for all new features.',
    30.00,
    'Bug count reduced by 70%, average code review score of 4.2/5.0, 95% code coverage with unit tests.',
    '6 weeks',
    DATE_SUB(CURDATE(), INTERVAL 5 DAY),
    'Employee completed code quality training and implemented: 1) Automated testing framework, 2) Code review checklist, 3) Pair programming sessions with senior developers. Bug count reduced from 15 to 6 in the period.',
    '["test_coverage_report.pdf", "code_review_scores.xlsx"]',
    'ACHIEVED',
    NULL,
    @created_date,
    NOW()
),
(
    @goal3_id,
    @pip_id,
    'Improve Customer Communication and Response Time',
    'Respond to customer inquiries within 2 hours during business hours. Maintain customer satisfaction score above 4.0/5.0.',
    35.00,
    '100% of customer inquiries responded to within 2 hours, customer satisfaction score of 4.3/5.0.',
    '4 weeks',
    DATE_SUB(CURDATE(), INTERVAL 8 DAY),
    'Employee has: 1) Set up email alerts and mobile notifications, 2) Created response templates for common inquiries, 3) Attended customer service training. Response time improved from average 6 hours to 1.5 hours.',
    '["customer_satisfaction_survey.pdf", "response_time_report.xlsx"]',
    'ACHIEVED',
    NULL,
    @created_date,
    NOW()
);

-- Create PIP Steps
-- Step 1: EMPLOYEE_ACKNOWLEDGEMENT - COMPLETED
INSERT INTO pip_steps (id, pip_id, step, status, due_date, completed_date, comments, signed_by, created_at, updated_at) VALUES
(UUID(), @pip_id, 'EMPLOYEE_ACKNOWLEDGEMENT', 'COMPLETED', @ack_date, @ack_date, 'Employee acknowledged the PIP and understands the expectations.', @employee_id, @created_date, @ack_date);

-- Step 2: ACTIVE_PIP - COMPLETED
INSERT INTO pip_steps (id, pip_id, step, status, due_date, completed_date, comments, signed_by, created_at, updated_at) VALUES
(UUID(), @pip_id, 'ACTIVE_PIP', 'COMPLETED', @active_end, @active_end, 'Active PIP period completed. Employee participated in regular check-ins and showed improvement.', @manager_id, @ack_date, @active_end);

-- Step 3: EMPLOYEE_SELF_REVIEW - COMPLETED
INSERT INTO pip_steps (id, pip_id, step, status, due_date, completed_date, comments, signed_by, created_at, updated_at) VALUES
(UUID(), @pip_id, 'EMPLOYEE_SELF_REVIEW', 'COMPLETED', @self_review_date, @self_review_date, 'Employee completed self-review. Provided detailed responses for all goals with supporting documentation.', @employee_id, @active_end, @self_review_date);

-- Step 4: MANAGER_REVIEW - PENDING (This is what we want to test!)
INSERT INTO pip_steps (id, pip_id, step, status, due_date, completed_date, comments, signed_by, created_at, updated_at) VALUES
(UUID(), @pip_id, 'MANAGER_REVIEW', 'PENDING', @manager_review_due, NULL, NULL, NULL, @self_review_date, @self_review_date);

-- Step 5: HRBP_DECISION - PENDING (Future step)
INSERT INTO pip_steps (id, pip_id, step, status, due_date, completed_date, comments, signed_by, created_at, updated_at) VALUES
(UUID(), @pip_id, 'HRBP_DECISION', 'PENDING', DATE_ADD(@manager_review_due, INTERVAL 5 DAY), NULL, NULL, NULL, @self_review_date, @self_review_date);

-- Create Check-ins during active period (3 check-ins)
INSERT INTO check_ins (id, pip_id, date, notes, attachments, created_at, updated_at) VALUES
(UUID(), @pip_id, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'First check-in: Employee has started implementing action plans. Attended time management training. Initial progress looks positive.', '["checkin_notes_1.pdf"]', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_SUB(CURDATE(), INTERVAL 30 DAY)),
(UUID(), @pip_id, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'Second check-in: Code quality improvements visible. Bug count reduced. Employee actively seeking feedback from senior developers.', '["checkin_notes_2.pdf", "code_metrics.xlsx"]', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
(UUID(), @pip_id, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Third check-in: Significant improvement across all metrics. Customer response time improved. Employee showing strong commitment to improvement.', '["checkin_notes_3.pdf", "improvement_metrics.xlsx"]', DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY));

-- Verification Query
-- SELECT 
--     p.id as pip_id,
--     p.status,
--     CONCAT(e.first_name, ' ', e.last_name) as employee,
--     CONCAT(m.first_name, ' ', m.last_name) as manager,
--     CONCAT(h.first_name, ' ', h.last_name) as hrbp,
--     (SELECT COUNT(*) FROM goals WHERE pip_id = p.id) as goal_count,
--     (SELECT COUNT(*) FROM pip_steps WHERE pip_id = p.id AND status = 'COMPLETED') as completed_steps,
--     (SELECT COUNT(*) FROM pip_steps WHERE pip_id = p.id AND status = 'PENDING') as pending_steps,
--     (SELECT step FROM pip_steps WHERE pip_id = p.id AND status = 'PENDING' LIMIT 1) as current_step
-- FROM pips p
-- JOIN users e ON p.employee_id = e.id
-- JOIN users m ON p.manager_id = m.id
-- JOIN users h ON p.hrbp_id = h.id
-- WHERE p.id = @pip_id;

