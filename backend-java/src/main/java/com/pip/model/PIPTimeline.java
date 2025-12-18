package com.pip.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PIPTimeline - Stores durations and policy settings, not absolute dates
 * Deadlines are calculated dynamically based on actual timestamps
 */
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PIPTimeline {
    // Durations (in days) - these are what managers set
    @Column(name = "employee_acknowledgement_duration")
    private Integer employeeAcknowledgementDuration; // days from HRBP approval

    @Column(name = "pip_active_duration")
    private Integer pipActiveDuration; // days from acknowledgement

    @Column(name = "self_review_buffer_duration")
    private Integer selfReviewBufferDuration; // days after active period ends

    @Column(name = "manager_review_buffer_duration")
    private Integer managerReviewBufferDuration; // days after self-review

    @Column(name = "hrbp_decision_buffer_duration")
    private Integer hrbpDecisionBufferDuration; // days after manager review

    // Legacy fields for backward compatibility (deprecated - use calculated deadlines)
    @Column(name = "employee_acknowledgement_deadline")
    private String employeeAcknowledgementDeadline; // DEPRECATED - calculated dynamically

    @Column(name = "employee_self_review_deadline")
    private String employeeSelfReviewDeadline; // DEPRECATED - calculated dynamically

    @Column(name = "manager_final_review_deadline")
    private String managerFinalReviewDeadline; // DEPRECATED - calculated dynamically

    @Column(name = "hrbp_final_decision_deadline")
    private String hrbpFinalDecisionDeadline; // DEPRECATED - calculated dynamically

    @Column(name = "grace_period")
    private Integer gracePeriod; // days - grace period for late submissions
}

