package com.pip.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PIPTimeline {
    @Column(name = "employee_acknowledgement_deadline")
    private String employeeAcknowledgementDeadline;

    @Column(name = "pip_active_duration")
    private Integer pipActiveDuration; // days

    @Column(name = "employee_self_review_deadline")
    private String employeeSelfReviewDeadline;

    @Column(name = "manager_final_review_deadline")
    private String managerFinalReviewDeadline;

    @Column(name = "hrbp_final_decision_deadline")
    private String hrbpFinalDecisionDeadline;

    @Column(name = "grace_period")
    private Integer gracePeriod; // days
}

