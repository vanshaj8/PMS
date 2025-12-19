package com.pip.core.model;

/**
 * Defines the type of workflow
 */
public enum WorkflowType {
    SEQUENTIAL,  // PIP: Steps must be completed in order
    PHASE_BASED  // Appraisal: Phases can run in parallel
}

