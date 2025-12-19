-- =====================================================
-- Unified Performance Management Platform
-- Rollback Script
-- =====================================================
-- This script rolls back the unified architecture migration
-- Use with caution - this will delete all unified core data
-- Version: 2.0
-- Created: 2024
-- =====================================================

-- WARNING: This will delete all data in unified core tables!
-- Make sure you have backups before running this script.

SET FOREIGN_KEY_CHECKS = 0;

-- Drop foreign keys first
ALTER TABLE workflow_steps DROP FOREIGN KEY IF EXISTS fk_step_phase;
ALTER TABLE workflow_steps DROP FOREIGN KEY IF EXISTS fk_step_completed_by;
ALTER TABLE shared_goals DROP FOREIGN KEY IF EXISTS fk_goal_employee;
ALTER TABLE shared_goals DROP FOREIGN KEY IF EXISTS fk_goal_parent;
ALTER TABLE shared_goals DROP FOREIGN KEY IF EXISTS fk_shared_goal_employee;
ALTER TABLE shared_goals DROP FOREIGN KEY IF EXISTS fk_shared_goal_parent;
ALTER TABLE goal_ratings DROP FOREIGN KEY IF EXISTS fk_rating_goal;
ALTER TABLE goal_ratings DROP FOREIGN KEY IF EXISTS fk_rating_rater;
ALTER TABLE goal_ratings DROP FOREIGN KEY IF EXISTS fk_goal_rating_goal;
ALTER TABLE goal_ratings DROP FOREIGN KEY IF EXISTS fk_goal_rating_rater;
ALTER TABLE unified_reviews DROP FOREIGN KEY IF EXISTS fk_review_reviewer;
ALTER TABLE unified_reviews DROP FOREIGN KEY IF EXISTS fk_review_reviewee;
ALTER TABLE unified_reviews DROP FOREIGN KEY IF EXISTS fk_review_form;
ALTER TABLE unified_reviews DROP FOREIGN KEY IF EXISTS fk_unified_review_reviewer;
ALTER TABLE unified_reviews DROP FOREIGN KEY IF EXISTS fk_unified_review_reviewee;
ALTER TABLE unified_reviews DROP FOREIGN KEY IF EXISTS fk_unified_review_form;
ALTER TABLE enhanced_audit_logs DROP FOREIGN KEY IF EXISTS fk_audit_user;
ALTER TABLE enhanced_audit_logs DROP FOREIGN KEY IF EXISTS fk_audit_log_user;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS goal_ratings;
DROP TABLE IF EXISTS workflow_steps;
DROP TABLE IF EXISTS workflow_phases;
DROP TABLE IF EXISTS unified_reviews;
DROP TABLE IF EXISTS shared_goals;
DROP TABLE IF EXISTS enhanced_audit_logs;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Rollback completed. Unified core tables have been dropped.' as status;

