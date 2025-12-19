package com.pip.core.model;

/**
 * Status of a workflow phase
 */
public enum PhaseStatus {
    PENDING,
    IN_PROGRESS,
    DUE_SOON,
    OVERDUE,
    COMPLETED,
    SKIPPED,
    BLOCKED
}

