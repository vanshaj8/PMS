-- =====================================================
-- Add User Profile Fields Migration
-- =====================================================
-- This migration adds fields required for the User Profile Page
-- Version: 2.2
-- Created: 2024
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Add new columns to users table (MySQL doesn't support IF NOT EXISTS, so we check first)
-- Check and add preferred_name
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'preferred_name');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN preferred_name VARCHAR(100) NULL COMMENT ''User preferred name/nickname'' AFTER last_name', 
    'SELECT ''Column preferred_name already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add phone_number
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'phone_number');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) NULL COMMENT ''User phone number'' AFTER email', 
    'SELECT ''Column phone_number already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add profile_photo
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'profile_photo');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN profile_photo VARCHAR(500) NULL COMMENT ''Profile photo URL or path'' AFTER phone_number', 
    'SELECT ''Column profile_photo already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add job_title
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'job_title');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN job_title VARCHAR(100) NULL COMMENT ''User job title'' AFTER role', 
    'SELECT ''Column job_title already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add business_unit
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'business_unit');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN business_unit VARCHAR(100) NULL COMMENT ''Business unit or division'' AFTER department', 
    'SELECT ''Column business_unit already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add employment_type
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'employment_type');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN employment_type ENUM(''FULL_TIME'', ''CONTRACT'', ''PART_TIME'', ''INTERN'') NULL COMMENT ''Employment type'' AFTER location', 
    'SELECT ''Column employment_type already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add date_of_joining
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'date_of_joining');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN date_of_joining DATE NULL COMMENT ''Date of joining the organization'' AFTER employment_type', 
    'SELECT ''Column date_of_joining already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add employment_level
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'employment_level');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN employment_level VARCHAR(50) NULL COMMENT ''Employment level or grade'' AFTER date_of_joining', 
    'SELECT ''Column employment_level already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add cost_center
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'cost_center');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN cost_center VARCHAR(50) NULL COMMENT ''Cost center code'' AFTER employment_level', 
    'SELECT ''Column cost_center already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add skip_level_manager_id
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'skip_level_manager_id');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN skip_level_manager_id CHAR(36) NULL COMMENT ''Skip-level manager ID (auto-derived)'' AFTER hrbp_id', 
    'SELECT ''Column skip_level_manager_id already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add last_login
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'last_login');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL COMMENT ''Last login timestamp'' AFTER updated_at', 
    'SELECT ''Column last_login already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add mfa_enabled
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'mfa_enabled');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE COMMENT ''Multi-factor authentication enabled'' AFTER last_login', 
    'SELECT ''Column mfa_enabled already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for skip-level manager (if not exists)
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND constraint_name = 'fk_user_skip_level_manager');
SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE users ADD CONSTRAINT fk_user_skip_level_manager FOREIGN KEY (skip_level_manager_id) REFERENCES users(id) ON DELETE SET NULL', 
    'SELECT ''Foreign key fk_user_skip_level_manager already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for new fields (check if they exist first)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_job_title');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_job_title ON users(job_title)', 'SELECT ''Index idx_job_title already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_business_unit');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_business_unit ON users(business_unit)', 'SELECT ''Index idx_business_unit already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_employment_type');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_employment_type ON users(employment_type)', 'SELECT ''Index idx_employment_type already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_date_of_joining');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_date_of_joining ON users(date_of_joining)', 'SELECT ''Index idx_date_of_joining already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_skip_level_manager_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_skip_level_manager_id ON users(skip_level_manager_id)', 'SELECT ''Index idx_skip_level_manager_id already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_last_login');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_last_login ON users(last_login)', 'SELECT ''Index idx_last_login already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

-- Update skip-level manager IDs for existing users
-- This is a one-time update to populate skip-level managers
UPDATE users u1
INNER JOIN users u2 ON u1.manager_id = u2.id
INNER JOIN users u3 ON u2.manager_id = u3.id
SET u1.skip_level_manager_id = u3.id
WHERE u1.manager_id IS NOT NULL 
  AND u2.manager_id IS NOT NULL 
  AND u1.skip_level_manager_id IS NULL;

