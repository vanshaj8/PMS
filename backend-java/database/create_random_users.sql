-- =====================================================
-- Create 10 Random Users for Each Role
-- Roles: EMPLOYEE, MANAGER, HRBP
-- Password for all: password123
-- =====================================================

-- Password hash for "password123" (BCrypt)
-- This hash is: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- =====================================================
-- 10 MANAGERS
-- =====================================================
INSERT INTO users (id, email, password, first_name, last_name, role, department, location, is_active) VALUES
(UUID(), 'sarah.chen@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sarah', 'Chen', 'MANAGER', 'Engineering', 'San Francisco', TRUE),
(UUID(), 'michael.rodriguez@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Michael', 'Rodriguez', 'MANAGER', 'Product', 'New York', TRUE),
(UUID(), 'emily.johnson@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Emily', 'Johnson', 'MANAGER', 'Sales', 'Chicago', TRUE),
(UUID(), 'david.kumar@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'David', 'Kumar', 'MANAGER', 'Marketing', 'Austin', TRUE),
(UUID(), 'jennifer.lee@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jennifer', 'Lee', 'MANAGER', 'Engineering', 'Seattle', TRUE),
(UUID(), 'robert.smith@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Robert', 'Smith', 'MANAGER', 'Operations', 'Boston', TRUE),
(UUID(), 'lisa.anderson@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lisa', 'Anderson', 'MANAGER', 'Finance', 'Denver', TRUE),
(UUID(), 'james.wilson@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'James', 'Wilson', 'MANAGER', 'Product', 'Los Angeles', TRUE),
(UUID(), 'maria.garcia@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Maria', 'Garcia', 'MANAGER', 'Engineering', 'Portland', TRUE),
(UUID(), 'william.brown@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'William', 'Brown', 'MANAGER', 'Sales', 'Miami', TRUE);

-- =====================================================
-- 10 HRBPs
-- =====================================================
INSERT INTO users (id, email, password, first_name, last_name, role, department, location, is_active) VALUES
(UUID(), 'patricia.martinez@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Patricia', 'Martinez', 'HRBP', 'HR', 'Headquarters', TRUE),
(UUID(), 'richard.taylor@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Richard', 'Taylor', 'HRBP', 'HR', 'New York', TRUE),
(UUID(), 'susan.thomas@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Susan', 'Thomas', 'HRBP', 'HR', 'San Francisco', TRUE),
(UUID(), 'joseph.jackson@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Joseph', 'Jackson', 'HRBP', 'HR', 'Chicago', TRUE),
(UUID(), 'jessica.white@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jessica', 'White', 'HRBP', 'HR', 'Austin', TRUE),
(UUID(), 'thomas.harris@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Thomas', 'Harris', 'HRBP', 'HR', 'Seattle', TRUE),
(UUID(), 'karen.martin@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Karen', 'Martin', 'HRBP', 'HR', 'Boston', TRUE),
(UUID(), 'christopher.thompson@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Christopher', 'Thompson', 'HRBP', 'HR', 'Denver', TRUE),
(UUID(), 'nancy.garcia@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nancy', 'Garcia', 'HRBP', 'HR', 'Los Angeles', TRUE),
(UUID(), 'daniel.moore@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Daniel', 'Moore', 'HRBP', 'HR', 'Portland', TRUE);

-- =====================================================
-- 10 EMPLOYEES
-- =====================================================
INSERT INTO users (id, email, password, first_name, last_name, role, department, location, is_active) VALUES
(UUID(), 'alex.miller@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Alex', 'Miller', 'EMPLOYEE', 'Engineering', 'San Francisco', TRUE),
(UUID(), 'sam.davis@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sam', 'Davis', 'EMPLOYEE', 'Product', 'New York', TRUE),
(UUID(), 'jordan.garcia@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jordan', 'Garcia', 'EMPLOYEE', 'Sales', 'Chicago', TRUE),
(UUID(), 'taylor.rodriguez@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Taylor', 'Rodriguez', 'EMPLOYEE', 'Marketing', 'Austin', TRUE),
(UUID(), 'riley.martinez@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Riley', 'Martinez', 'EMPLOYEE', 'Engineering', 'Seattle', TRUE),
(UUID(), 'casey.lopez@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Casey', 'Lopez', 'EMPLOYEE', 'Operations', 'Boston', TRUE),
(UUID(), 'morgan.gonzalez@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Morgan', 'Gonzalez', 'EMPLOYEE', 'Finance', 'Denver', TRUE),
(UUID(), 'cameron.lee@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Cameron', 'Lee', 'EMPLOYEE', 'Product', 'Los Angeles', TRUE),
(UUID(), 'avery.kim@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Avery', 'Kim', 'EMPLOYEE', 'Engineering', 'Portland', TRUE),
(UUID(), 'quinn.nguyen@pip.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Quinn', 'Nguyen', 'EMPLOYEE', 'Sales', 'Miami', TRUE);

-- =====================================================
-- Update Employee-Manager relationships
-- Assign employees to managers (distribute evenly)
-- Using temporary variables to avoid subquery issues
-- =====================================================
SET @sarah_id = (SELECT id FROM users WHERE email = 'sarah.chen@pip.com' LIMIT 1);
SET @michael_id = (SELECT id FROM users WHERE email = 'michael.rodriguez@pip.com' LIMIT 1);
SET @emily_id = (SELECT id FROM users WHERE email = 'emily.johnson@pip.com' LIMIT 1);
SET @david_id = (SELECT id FROM users WHERE email = 'david.kumar@pip.com' LIMIT 1);
SET @jennifer_id = (SELECT id FROM users WHERE email = 'jennifer.lee@pip.com' LIMIT 1);

UPDATE users SET manager_id = @sarah_id WHERE email IN ('alex.miller@pip.com', 'riley.martinez@pip.com');
UPDATE users SET manager_id = @michael_id WHERE email IN ('sam.davis@pip.com', 'cameron.lee@pip.com');
UPDATE users SET manager_id = @emily_id WHERE email IN ('jordan.garcia@pip.com', 'morgan.gonzalez@pip.com');
UPDATE users SET manager_id = @david_id WHERE email IN ('taylor.rodriguez@pip.com', 'avery.kim@pip.com');
UPDATE users SET manager_id = @jennifer_id WHERE email IN ('casey.lopez@pip.com', 'quinn.nguyen@pip.com');

-- =====================================================
-- Update Employee-HRBP relationships
-- Assign employees to HRBPs (distribute evenly)
-- =====================================================
SET @patricia_id = (SELECT id FROM users WHERE email = 'patricia.martinez@pip.com' LIMIT 1);
SET @richard_id = (SELECT id FROM users WHERE email = 'richard.taylor@pip.com' LIMIT 1);
SET @susan_id = (SELECT id FROM users WHERE email = 'susan.thomas@pip.com' LIMIT 1);
SET @joseph_id = (SELECT id FROM users WHERE email = 'joseph.jackson@pip.com' LIMIT 1);
SET @jessica_id = (SELECT id FROM users WHERE email = 'jessica.white@pip.com' LIMIT 1);

UPDATE users SET hrbp_id = @patricia_id WHERE email IN ('alex.miller@pip.com', 'sam.davis@pip.com');
UPDATE users SET hrbp_id = @richard_id WHERE email IN ('jordan.garcia@pip.com', 'taylor.rodriguez@pip.com');
UPDATE users SET hrbp_id = @susan_id WHERE email IN ('riley.martinez@pip.com', 'casey.lopez@pip.com');
UPDATE users SET hrbp_id = @joseph_id WHERE email IN ('morgan.gonzalez@pip.com', 'cameron.lee@pip.com');
UPDATE users SET hrbp_id = @jessica_id WHERE email IN ('avery.kim@pip.com', 'quinn.nguyen@pip.com');

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the users were created:
-- SELECT role, COUNT(*) as count FROM users GROUP BY role;
-- Expected: ADMIN=1, MANAGER=11 (1 default + 10 new), EMPLOYEE=11 (1 default + 10 new), HRBP=11 (1 default + 10 new), EXECUTIVE=1

