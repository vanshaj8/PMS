package com.pip.goals.model;

import com.pip.core.model.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Centralized Goal entity - Single source of truth for all goals
 * Goals outlive PIP and Appraisal cycles
 */
@Entity
@Table(name = "goals")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Goal extends BaseEntity {
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
    private LocalDate targetDate;

    @Column(name = "achieved_date")
    private LocalDate achievedDate;

    // Versioning
    @Column(name = "version_number", nullable = false)
    private Integer versionNumber = 1;

    @Column(name = "previous_version_id", columnDefinition = "CHAR(36)")
    private String previousVersionId; // Links to previous version

    @Column(name = "is_current_version", nullable = false)
    private Boolean isCurrentVersion = true;

    // Context tracking
    @Column(name = "created_in_context")
    private String createdInContext; // PIP, APPRAISAL, MANUAL

    @Column(name = "created_in_context_id", columnDefinition = "CHAR(36)")
    private String createdInContextId;

    // Locking
    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked = false;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "locked_by", columnDefinition = "CHAR(36)")
    private String lockedBy;

    @Column(name = "lock_reason", columnDefinition = "TEXT")
    private String lockReason;

    // Metadata
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON for additional data

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoalVersion> versions;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoalContextLink> contextLinks;
}

