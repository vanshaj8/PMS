package com.pip.core.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Unified Goal entity - shared across PIP and Appraisal
 * Goals are appraisal-first, referenced by PIP when triggered
 */
@Entity
@Table(name = "shared_goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SharedGoal extends BaseEntity {
    @Column(name = "employee_id", nullable = false, columnDefinition = "CHAR(36)")
    private String employeeId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "weightage", nullable = false)
    private Double weightage; // 0-100

    @Enumerated(EnumType.STRING)
    @Column(name = "goal_type", nullable = false)
    private GoalType goalType;

    @Column(name = "success_criteria", columnDefinition = "TEXT")
    private String successCriteria;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GoalStatus status = GoalStatus.ACTIVE;

    @Column(name = "target_date")
    private java.time.LocalDate targetDate;

    @Column(name = "achieved_date")
    private java.time.LocalDate achievedDate;

    // Versioning for audit
    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Column(name = "parent_goal_id", columnDefinition = "CHAR(36)")
    private String parentGoalId; // For goal updates/versions

    // Context tracking
    @Enumerated(EnumType.STRING)
    @Column(name = "source_context")
    private WorkflowContext sourceContext; // Where goal was created

    @Column(name = "source_id", columnDefinition = "CHAR(36)")
    private String sourceId; // PIP ID or AppraisalParticipant ID

    @Column(name = "locked")
    private Boolean locked = false;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoalRating> ratings;
}

