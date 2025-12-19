-- =====================================================
-- Migration: Add Appraisal Integration Fields to PIP Table
-- Date: 2025-12-19
-- Purpose: Integrate PIP and Appraisal models by adding
--          references from PIP to AppraisalParticipant and AppraisalCycle
-- =====================================================

USE pip_management;

-- Add optional appraisal reference columns to pips table (READ-ONLY metadata only)
-- These fields allow managers to optionally reference an appraisal when creating a PIP
-- They are for context/reference only and do NOT create any dependencies
ALTER TABLE pips
ADD COLUMN appraisal_participant_id CHAR(36) NULL AFTER original_active_duration,
ADD COLUMN appraisal_cycle_id CHAR(36) NULL AFTER appraisal_participant_id;

-- Add foreign key constraints (optional - can be NULL for PIPs not from appraisals)
ALTER TABLE pips
ADD CONSTRAINT fk_pip_appraisal_participant 
    FOREIGN KEY (appraisal_participant_id) 
    REFERENCES appraisal_participants(id) 
    ON DELETE SET NULL,
ADD CONSTRAINT fk_pip_appraisal_cycle 
    FOREIGN KEY (appraisal_cycle_id) 
    REFERENCES appraisal_cycles(id) 
    ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX idx_pip_appraisal_participant ON pips(appraisal_participant_id);
CREATE INDEX idx_pip_appraisal_cycle ON pips(appraisal_cycle_id);

-- =====================================================
-- Migration Complete
-- =====================================================
-- Note: Existing PIPs will have NULL values for these fields
--       Managers may optionally populate these when manually creating a PIP
--       These are READ-ONLY metadata references only - no dependencies created

