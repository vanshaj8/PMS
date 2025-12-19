package com.pip.goals.model;

import com.pip.core.model.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Immutable snapshot of goals at Appraisal cycle start
 * Used for evaluations - never changes after snapshot
 */
@Entity
@Table(name = "appraisal_goal_snapshots")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalGoalSnapshot extends BaseEntity {
    @Column(name = "appraisal_cycle_id", nullable = false, columnDefinition = "CHAR(36)")
    private String appraisalCycleId;

    @Column(name = "participant_id", nullable = false, columnDefinition = "CHAR(36)")
    private String participantId;

    @Column(name = "goal_id", nullable = false, columnDefinition = "CHAR(36)")
    private String goalId; // Reference to original goal

    @Column(name = "goal_version_number", nullable = false)
    private Integer goalVersionNumber; // Version at snapshot time

    // Snapshot data (immutable copy)
    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "weightage", nullable = false)
    private Double weightage;

    @Column(name = "success_criteria", columnDefinition = "TEXT")
    private String successCriteria;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "snapshot_taken_at", nullable = false)
    private LocalDateTime snapshotTakenAt = LocalDateTime.now();

    @Column(name = "snapshot_taken_by", nullable = false, columnDefinition = "CHAR(36)")
    private String snapshotTakenBy;
}

