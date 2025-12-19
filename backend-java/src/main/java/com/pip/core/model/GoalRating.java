package com.pip.core.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Rating for a specific goal
 */
@Entity
@Table(name = "goal_ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoalRating extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private SharedGoal goal;

    @Column(name = "goal_id", insertable = false, updatable = false)
    private String goalId;

    @Enumerated(EnumType.STRING)
    @Column(name = "rating_source", nullable = false)
    private RatingSource ratingSource;

    @Column(name = "rater_id", nullable = false, columnDefinition = "CHAR(36)")
    private String raterId;

    @Column(name = "rating_value", nullable = false)
    private Double ratingValue;

    @Column(name = "rating_label")
    private String ratingLabel;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "is_final")
    private Boolean isFinal = false;
}

