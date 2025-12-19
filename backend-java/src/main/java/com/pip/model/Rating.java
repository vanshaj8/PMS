package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Rating {
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
    @Column(name = "rating_source", nullable = false)
    private RatingSource ratingSource;

    @Column(name = "rater_id", nullable = false, columnDefinition = "CHAR(36)")
    private String raterId; // Who gave this rating

    // Rating value (numeric or descriptive mapped to numeric)
    @Column(nullable = false)
    private Double ratingValue;

    @Column(name = "rating_label")
    private String ratingLabel; // e.g., "Outstanding", "Exceeds Expectations"

    // Section-wise ratings stored as JSON
    @Column(name = "section_ratings", columnDefinition = "TEXT")
    private String sectionRatings; // JSON: { sectionId: rating }

    // Auto-calculated weighted rating
    @Column(name = "weighted_rating")
    private Double weightedRating;

    @Column(name = "is_calibrated")
    private Boolean isCalibrated = false;

    @Column(name = "calibrated_rating")
    private Double calibratedRating;

    @Column(name = "calibration_reason", columnDefinition = "TEXT")
    private String calibrationReason;

    @Column(name = "is_final")
    private Boolean isFinal = false;

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

