package com.pip.core.model;

/**
 * Status of a workflow step
 */
public enum StepStatus {
    PENDING,
    IN_PROGRESS,
    DUE_SOON,
    OVERDUE,
    COMPLETED,
    SKIPPED,
    BLOCKED
}

