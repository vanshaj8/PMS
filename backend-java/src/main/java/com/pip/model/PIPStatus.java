package com.pip.model;

public enum PIPStatus {
    DRAFT,
    PENDING_HRBP_REVIEW,
    PENDING_EMPLOYEE_ACKNOWLEDGEMENT,
    OVERDUE_EMPLOYEE_ACKNOWLEDGEMENT, // New: Employee missed acknowledgement deadline
    ACTIVE,
    ACTIVE_PENDING_VALIDATION, // New: Active period ended but validation pending
    PENDING_EMPLOYEE_SELF_REVIEW,
    PENDING_MANAGER_REVIEW,
    OVERDUE_MANAGER_REVIEW, // New: Manager missed review deadline
    PENDING_HRBP_DECISION,
    OVERDUE_HRBP_DECISION, // New: HRBP missed decision deadline
    ADMIN_INTERVENTION_REQUIRED, // New: Escalated to admin
    COMPLETED,
    OVERDUE,
    CANCELLED,
    DEEMED_ACKNOWLEDGED // New: HRBP marked as acknowledged after employee missed deadline
}
