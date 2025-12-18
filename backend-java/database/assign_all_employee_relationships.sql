-- =====================================================
-- Assign Manager and HRBP to ALL Employees
-- Each employee gets exactly one Manager and one HRBP
-- =====================================================

-- Get Manager IDs
SET @sarah_manager_id = (SELECT id FROM users WHERE email = 'sarah.chen@pip.com' LIMIT 1);
SET @michael_manager_id = (SELECT id FROM users WHERE email = 'michael.rodriguez@pip.com' LIMIT 1);
SET @emily_manager_id = (SELECT id FROM users WHERE email = 'emily.johnson@pip.com' LIMIT 1);
SET @david_manager_id = (SELECT id FROM users WHERE email = 'david.kumar@pip.com' LIMIT 1);
SET @jennifer_manager_id = (SELECT id FROM users WHERE email = 'jennifer.lee@pip.com' LIMIT 1);
SET @robert_manager_id = (SELECT id FROM users WHERE email = 'robert.smith@pip.com' LIMIT 1);
SET @lisa_manager_id = (SELECT id FROM users WHERE email = 'lisa.anderson@pip.com' LIMIT 1);
SET @james_manager_id = (SELECT id FROM users WHERE email = 'james.wilson@pip.com' LIMIT 1);
SET @maria_manager_id = (SELECT id FROM users WHERE email = 'maria.garcia@pip.com' LIMIT 1);
SET @william_manager_id = (SELECT id FROM users WHERE email = 'william.brown@pip.com' LIMIT 1);
SET @default_manager_id = (SELECT id FROM users WHERE email = 'manager@pip.com' LIMIT 1);

-- Get HRBP IDs
SET @patricia_hrbp_id = (SELECT id FROM users WHERE email = 'patricia.martinez@pip.com' LIMIT 1);
SET @richard_hrbp_id = (SELECT id FROM users WHERE email = 'richard.taylor@pip.com' LIMIT 1);
SET @susan_hrbp_id = (SELECT id FROM users WHERE email = 'susan.thomas@pip.com' LIMIT 1);
SET @joseph_hrbp_id = (SELECT id FROM users WHERE email = 'joseph.jackson@pip.com' LIMIT 1);
SET @jessica_hrbp_id = (SELECT id FROM users WHERE email = 'jessica.white@pip.com' LIMIT 1);
SET @thomas_hrbp_id = (SELECT id FROM users WHERE email = 'thomas.harris@pip.com' LIMIT 1);
SET @karen_hrbp_id = (SELECT id FROM users WHERE email = 'karen.martin@pip.com' LIMIT 1);
SET @christopher_hrbp_id = (SELECT id FROM users WHERE email = 'christopher.thompson@pip.com' LIMIT 1);
SET @nancy_hrbp_id = (SELECT id FROM users WHERE email = 'nancy.garcia@pip.com' LIMIT 1);
SET @daniel_hrbp_id = (SELECT id FROM users WHERE email = 'daniel.moore@pip.com' LIMIT 1);
SET @default_hrbp_id = (SELECT id FROM users WHERE email = 'hrbp@pip.com' LIMIT 1);

-- Assign Managers and HRBPs to Employees
-- Distribute employees evenly across managers and HRBPs

-- Employee 1: alex.miller@pip.com
UPDATE users SET manager_id = @sarah_manager_id, hrbp_id = @patricia_hrbp_id WHERE email = 'alex.miller@pip.com';

-- Employee 2: sam.davis@pip.com
UPDATE users SET manager_id = @michael_manager_id, hrbp_id = @patricia_hrbp_id WHERE email = 'sam.davis@pip.com';

-- Employee 3: jordan.garcia@pip.com
UPDATE users SET manager_id = @emily_manager_id, hrbp_id = @richard_hrbp_id WHERE email = 'jordan.garcia@pip.com';

-- Employee 4: taylor.rodriguez@pip.com
UPDATE users SET manager_id = @david_manager_id, hrbp_id = @richard_hrbp_id WHERE email = 'taylor.rodriguez@pip.com';

-- Employee 5: riley.martinez@pip.com
UPDATE users SET manager_id = @sarah_manager_id, hrbp_id = @susan_hrbp_id WHERE email = 'riley.martinez@pip.com';

-- Employee 6: casey.lopez@pip.com
UPDATE users SET manager_id = @jennifer_manager_id, hrbp_id = @susan_hrbp_id WHERE email = 'casey.lopez@pip.com';

-- Employee 7: morgan.gonzalez@pip.com
UPDATE users SET manager_id = @emily_manager_id, hrbp_id = @joseph_hrbp_id WHERE email = 'morgan.gonzalez@pip.com';

-- Employee 8: cameron.lee@pip.com
UPDATE users SET manager_id = @michael_manager_id, hrbp_id = @joseph_hrbp_id WHERE email = 'cameron.lee@pip.com';

-- Employee 9: avery.kim@pip.com
UPDATE users SET manager_id = @david_manager_id, hrbp_id = @jessica_hrbp_id WHERE email = 'avery.kim@pip.com';

-- Employee 10: quinn.nguyen@pip.com
UPDATE users SET manager_id = @jennifer_manager_id, hrbp_id = @jessica_hrbp_id WHERE email = 'quinn.nguyen@pip.com';

-- Employee 11: employee@pip.com (default employee)
UPDATE users SET manager_id = @default_manager_id, hrbp_id = @default_hrbp_id WHERE email = 'employee@pip.com';

-- Verification Query (run after update):
-- SELECT 
--     u.email as employee_email,
--     CONCAT(u.first_name, ' ', u.last_name) as employee_name,
--     m.email as manager_email,
--     CONCAT(m.first_name, ' ', m.last_name) as manager_name,
--     h.email as hrbp_email,
--     CONCAT(h.first_name, ' ', h.last_name) as hrbp_name
-- FROM users u
-- LEFT JOIN users m ON u.manager_id = m.id
-- LEFT JOIN users h ON u.hrbp_id = h.id
-- WHERE u.role = 'EMPLOYEE'
-- ORDER BY u.last_name;

