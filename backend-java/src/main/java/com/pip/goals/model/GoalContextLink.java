package com.pip.goals.model;

import com.pip.core.model.BaseEntity;
import com.pip.core.model.WorkflowContext;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Links goals to contexts (PIP, Appraisal, etc.)
 * Tracks which goals are used in which cycles
 */
@Entity
@Table(name = "goal_context_links")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class GoalContextLink extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    @Column(name = "goal_id", insertable = false, updatable = false)
    private String goalId;

    @Enumerated(EnumType.STRING)
    @Column(name = "context", nullable = false)
    private WorkflowContext context;

    @Column(name = "context_id", nullable = false, columnDefinition = "CHAR(36)")
    private String contextId; // PIP ID, AppraisalParticipant ID, etc.

    @Column(name = "goal_version_number", nullable = false)
    private Integer goalVersionNumber; // Snapshot of version used

    @Column(name = "weightage_in_context")
    private Double weightageInContext; // May differ from goal weightage

    @Column(name = "is_snapshot", nullable = false)
    private Boolean isSnapshot = false; // True for Appraisal snapshots

    @Column(name = "snapshot_taken_at")
    private LocalDateTime snapshotTakenAt;

    @Column(name = "linked_at", nullable = false)
    private LocalDateTime linkedAt = LocalDateTime.now();
}

