package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "calibration_adjustments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalibrationAdjustment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore
    private CalibrationSession session;

    @Column(name = "session_id", insertable = false, updatable = false)
    private String sessionId;

    @Column(name = "participant_id", nullable = false, columnDefinition = "CHAR(36)")
    private String participantId;

    @Column(name = "original_rating", nullable = false)
    private Double originalRating;

    @Column(name = "adjusted_rating", nullable = false)
    private Double adjustedRating;

    @Column(name = "justification", columnDefinition = "TEXT", nullable = false)
    private String justification;

    @Column(name = "adjusted_by", nullable = false, columnDefinition = "CHAR(36)")
    private String adjustedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

