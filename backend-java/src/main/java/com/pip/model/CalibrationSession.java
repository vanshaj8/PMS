package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "calibration_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalibrationSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "cycle_id", nullable = false, columnDefinition = "CHAR(36)")
    private String cycleId;

    @Column(name = "session_name", nullable = false)
    private String sessionName;

    @Column(name = "department")
    private String department; // null = organization-wide

    @Column(name = "team")
    private String team; // null = all teams

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CalibrationStatus status = CalibrationStatus.DRAFT;

    @Column(name = "forced_distribution_applied")
    private Boolean forcedDistributionApplied = false;

    // Distribution targets stored as JSON
    @Column(name = "distribution_targets", columnDefinition = "TEXT")
    private String distributionTargets; // JSON: { rating: percentage }

    // Actual distribution stored as JSON
    @Column(name = "actual_distribution", columnDefinition = "TEXT")
    private String actualDistribution; // JSON: { rating: count, percentage }

    @Column(name = "facilitated_by", nullable = false, columnDefinition = "CHAR(36)")
    private String facilitatedBy; // HR/Admin user ID

    @Column(name = "participants", columnDefinition = "TEXT")
    private String participants; // JSON array of user IDs who participated

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CalibrationAdjustment> adjustments;

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

