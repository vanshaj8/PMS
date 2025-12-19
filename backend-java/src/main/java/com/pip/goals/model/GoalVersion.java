package com.pip.goals.model;

import com.pip.core.model.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

/**
 * Immutable version history of goals
 * Once a goal is used in a completed cycle, it becomes immutable
 */
@Entity
@Table(name = "goal_versions")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class GoalVersion extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    @Column(name = "goal_id", insertable = false, updatable = false)
    private String goalId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

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

    @Column(name = "changed_fields", columnDefinition = "TEXT")
    private String changedFields; // JSON: { field: { old: value, new: value } }

    @Column(name = "change_reason", columnDefinition = "TEXT")
    private String changeReason;

    @Column(name = "changed_by", nullable = false, columnDefinition = "CHAR(36)")
    private String changedBy;
}

