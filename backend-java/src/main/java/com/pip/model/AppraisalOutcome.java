package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "appraisal_outcomes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalOutcome {
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

    @Column(name = "final_rating", nullable = false)
    private Double finalRating;

    @Column(name = "final_rating_label")
    private String finalRatingLabel;

    @Column(name = "promotion_recommendation")
    private Boolean promotionRecommendation;

    @Column(name = "bonus_percentage")
    private Double bonusPercentage;

    @Column(name = "hike_percentage")
    private Double hikePercentage;

    @Column(name = "development_plan", columnDefinition = "TEXT")
    private String developmentPlan; // JSON or text

    @Column(name = "pip_triggered")
    private Boolean pipTriggered = false;

    @Column(name = "pip_id", columnDefinition = "CHAR(36)")
    private String pipId; // If PIP was auto-created

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "approved_by", nullable = false, columnDefinition = "CHAR(36)")
    private String approvedBy;

    @Column(name = "approved_at", nullable = false)
    private LocalDateTime approvedAt;

    @Column(name = "released_to_employee")
    private Boolean releasedToEmployee = false;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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

