package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "pips")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PIP {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "employee_id", nullable = false, columnDefinition = "CHAR(36)")
    private String employeeId;

    @Column(name = "manager_id", nullable = false, columnDefinition = "CHAR(36)")
    private String managerId;

    @Column(name = "hrbp_id", nullable = false, columnDefinition = "CHAR(36)")
    private String hrbpId;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "supporting_documents", columnDefinition = "TEXT")
    private String supportingDocuments; // JSON array as string

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Goal> goals;

    @Embedded
    private PIPTimeline timeline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PIPStatus status;

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PIPStep> steps;

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CheckIn> checkIns;

    @Column(name = "final_outcome")
    @Enumerated(EnumType.STRING)
    private FinalOutcome finalOutcome;

    @Column(name = "final_remarks", columnDefinition = "TEXT")
    private String finalRemarks;

    @Column(nullable = false)
    private Boolean locked = false;

    @Column(nullable = false)
    private Integer version = 1;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Actual timestamps for deadline calculation
    @Column(name = "hrbp_approved_at")
    private LocalDateTime hrbpApprovedAt; // When HRBP approved initial review

    @Column(name = "employee_acknowledged_at")
    private LocalDateTime employeeAcknowledgedAt; // When employee acknowledged

    @Column(name = "active_period_started_at")
    private LocalDateTime activePeriodStartedAt; // When active period actually started

    @Column(name = "active_period_ended_at")
    private LocalDateTime activePeriodEndedAt; // When active period ended

    @Column(name = "self_review_submitted_at")
    private LocalDateTime selfReviewSubmittedAt; // When employee submitted self-review

    @Column(name = "manager_review_completed_at")
    private LocalDateTime managerReviewCompletedAt; // When manager completed review

    // Extension tracking
    @Column(name = "extension_count")
    private Integer extensionCount = 0; // Number of times PIP has been extended

    @Column(name = "original_active_duration")
    private Integer originalActiveDuration; // Original duration before extensions

    // Metadata for compliance and auditing
    @Column(name = "ack_escalation_metadata", columnDefinition = "TEXT")
    private String ackEscalationMetadata; // JSON: escalation tracking for acknowledgement

    @Column(name = "checkin_validation_metadata", columnDefinition = "TEXT")
    private String checkInValidationMetadata; // JSON: check-in validation results

    @Column(name = "success_criteria_metadata", columnDefinition = "TEXT")
    private String successCriteriaMetadata; // JSON: success score and criteria

    @Column(name = "extension_policy_metadata", columnDefinition = "TEXT")
    private String extensionPolicyMetadata; // JSON: extension policy and usage

    @Column(name = "timeline_versions", columnDefinition = "TEXT")
    private String timelineVersions; // JSON array: timeline version history

    @Column(name = "sla_attribution", columnDefinition = "TEXT")
    private String slaAttribution; // JSON: delay attribution per step

    @Column(name = "compliance_mode")
    private String complianceMode = "STANDARD"; // STANDARD, STRICT, LOCAL_LAW

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (extensionCount == null) {
            extensionCount = 0;
        }
        if (complianceMode == null) {
            complianceMode = "STANDARD";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        version++;
    }
}

