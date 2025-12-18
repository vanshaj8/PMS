-- =====================================================
-- Update Employee-Manager and Employee-HRBP relationships
-- =====================================================

-- Set manager relationships
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

-- Set HRBP relationships
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

