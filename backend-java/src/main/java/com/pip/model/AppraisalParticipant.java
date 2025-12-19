package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "appraisal_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id", nullable = false)
    @JsonIgnore
    private AppraisalCycle cycle;

    @Column(name = "cycle_id", insertable = false, updatable = false)
    private String cycleId;

    @Column(name = "employee_id", nullable = false, columnDefinition = "CHAR(36)")
    private String employeeId;

    @Column(name = "manager_id", nullable = false, columnDefinition = "CHAR(36)")
    private String managerId;

    @Column(name = "skip_level_manager_id", columnDefinition = "CHAR(36)")
    private String skipLevelManagerId;

    @Column(name = "hrbp_id", columnDefinition = "CHAR(36)")
    private String hrbpId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantStatus status = ParticipantStatus.ELIGIBLE;

    @Column(name = "eligibility_reason", columnDefinition = "TEXT")
    private String eligibilityReason;

    @Column(name = "goals_locked")
    private Boolean goalsLocked = false;

    @Column(name = "goals_locked_at")
    private LocalDateTime goalsLockedAt;

    @Column(name = "self_review_submitted")
    private Boolean selfReviewSubmitted = false;

    @Column(name = "self_review_submitted_at")
    private LocalDateTime selfReviewSubmittedAt;

    @Column(name = "manager_review_submitted")
    private Boolean managerReviewSubmitted = false;

    @Column(name = "manager_review_submitted_at")
    private LocalDateTime managerReviewSubmittedAt;

    @Column(name = "skip_review_submitted")
    private Boolean skipReviewSubmitted = false;

    @Column(name = "skip_review_submitted_at")
    private LocalDateTime skipReviewSubmittedAt;

    @Column(name = "calibrated")
    private Boolean calibrated = false;

    @Column(name = "calibrated_at")
    private LocalDateTime calibratedAt;

    @Column(name = "final_outcome_released")
    private Boolean finalOutcomeReleased = false;

    @Column(name = "final_outcome_released_at")
    private LocalDateTime finalOutcomeReleasedAt;

    @Column(name = "employee_acknowledged")
    private Boolean employeeAcknowledged = false;

    @Column(name = "employee_acknowledged_at")
    private LocalDateTime employeeAcknowledgedAt;

    @Column(name = "employee_acknowledgement_comments", columnDefinition = "TEXT")
    private String employeeAcknowledgementComments;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<AppraisalGoal> goals;

    @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ReviewResponse> reviewResponses;

    @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Rating> ratings;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

