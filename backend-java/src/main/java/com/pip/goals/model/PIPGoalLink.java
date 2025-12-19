package com.pip.goals.model;

import com.pip.core.model.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Links goals to PIPs
 * PIPs reference goal versions directly
 */
@Entity
@Table(name = "pip_goal_links")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PIPGoalLink extends BaseEntity {
    @Column(name = "pip_id", nullable = false, columnDefinition = "CHAR(36)")
    private String pipId;

    @Column(name = "goal_id", nullable = false, columnDefinition = "CHAR(36)")
    private String goalId;

    @Column(name = "goal_version_number", nullable = false)
    private Integer goalVersionNumber; // Specific version used in PIP

    @Column(name = "weightage_in_pip")
    private Double weightageInPip; // May differ from goal weightage

    @Column(name = "linked_at", nullable = false)
    private LocalDateTime linkedAt = LocalDateTime.now();

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}

