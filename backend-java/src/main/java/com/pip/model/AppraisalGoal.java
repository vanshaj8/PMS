package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "appraisal_goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalGoal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    @JsonIgnore
    private AppraisalParticipant participant;

    @Column(name = "participant_id", insertable = false, updatable = false)
    private String participantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal_type", nullable = false)
    private AppraisalGoalType goalType;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double weightage;

    @Column(name = "success_criteria", columnDefinition = "TEXT")
    private String successCriteria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppraisalGoalStatus status = AppraisalGoalStatus.ACTIVE;

    @Column(name = "source", columnDefinition = "TEXT")
    private String source; // JSON: imported from goal module, created during year, etc.

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}

