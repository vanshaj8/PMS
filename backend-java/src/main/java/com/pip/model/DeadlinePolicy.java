package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Deadline Policy Configuration
 * Defines min/max/default values for PIP deadlines
 * Managed by Admin/HR
 */
@Entity
@Table(name = "deadline_policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeadlinePolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "policy_name", nullable = false, unique = true)
    private String policyName; // e.g., "STANDARD_PIP", "EXTENDED_PIP"

    // HRBP Initial Review
    @Column(name = "hrbp_review_min_days")
    private Integer hrbpReviewMinDays = 2;

    @Column(name = "hrbp_review_max_days")
    private Integer hrbpReviewMaxDays = 5;

    @Column(name = "hrbp_review_default_days")
    private Integer hrbpReviewDefaultDays = 3;

    @Column(name = "hrbp_review_business_days_only")
    private Boolean hrbpReviewBusinessDaysOnly = true;

    // Employee Acknowledgement
    @Column(name = "employee_ack_min_days")
    private Integer employeeAckMinDays = 3;

    @Column(name = "employee_ack_max_days")
    private Integer employeeAckMaxDays = 7;

    @Column(name = "employee_ack_default_days")
    private Integer employeeAckDefaultDays = 5;

    @Column(name = "employee_ack_business_days_only")
    private Boolean employeeAckBusinessDaysOnly = true;

    // PIP Active Duration
    @Column(name = "active_duration_min_days")
    private Integer activeDurationMinDays = 30;

    @Column(name = "active_duration_max_days")
    private Integer activeDurationMaxDays = 90;

    @Column(name = "active_duration_default_days")
    private Integer activeDurationDefaultDays = 50;

    @Column(name = "active_duration_business_days_only")
    private Boolean activeDurationBusinessDaysOnly = false; // Calendar days

    // Self-Review Buffer
    @Column(name = "self_review_buffer_min_days")
    private Integer selfReviewBufferMinDays = 1;

    @Column(name = "self_review_buffer_max_days")
    private Integer selfReviewBufferMaxDays = 5;

    @Column(name = "self_review_buffer_default_days")
    private Integer selfReviewBufferDefaultDays = 3;

    @Column(name = "self_review_buffer_business_days_only")
    private Boolean selfReviewBufferBusinessDaysOnly = true;

    // Manager Review Buffer
    @Column(name = "manager_review_buffer_min_days")
    private Integer managerReviewBufferMinDays = 3;

    @Column(name = "manager_review_buffer_max_days")
    private Integer managerReviewBufferMaxDays = 7;

    @Column(name = "manager_review_buffer_default_days")
    private Integer managerReviewBufferDefaultDays = 5;

    @Column(name = "manager_review_buffer_business_days_only")
    private Boolean managerReviewBufferBusinessDaysOnly = true;

    // HRBP Decision Buffer
    @Column(name = "hrbp_decision_buffer_min_days")
    private Integer hrbpDecisionBufferMinDays = 3;

    @Column(name = "hrbp_decision_buffer_max_days")
    private Integer hrbpDecisionBufferMaxDays = 7;

    @Column(name = "hrbp_decision_buffer_default_days")
    private Integer hrbpDecisionBufferDefaultDays = 5;

    @Column(name = "hrbp_decision_buffer_business_days_only")
    private Boolean hrbpDecisionBufferBusinessDaysOnly = true;

    // Grace Period
    @Column(name = "grace_period_days")
    private Integer gracePeriodDays = 2;

    @Column(name = "grace_period_business_days_only")
    private Boolean gracePeriodBusinessDaysOnly = true;

    // Check-In Requirements
    @Column(name = "min_check_in_frequency_days")
    private Integer minCheckInFrequencyDays = 7; // Minimum 1 check-in every X days

    @Column(name = "min_check_ins_required")
    private Integer minCheckInsRequired = 3; // Minimum total check-ins before completing active period

    // Extension Policy
    @Column(name = "max_extensions_allowed")
    private Integer maxExtensionsAllowed = 1;

    @Column(name = "max_total_pip_duration_days")
    private Integer maxTotalPipDurationDays = 120;

    // Escalation Thresholds (in days overdue)
    @Column(name = "escalation_to_hrbp_days")
    private Integer escalationToHrbpDays = 3;

    @Column(name = "escalation_to_admin_days")
    private Integer escalationToAdminDays = 7;

    @Column(name = "active")
    private Boolean active = true;
}

