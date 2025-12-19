package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "appraisal_cycles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalCycle {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "cycle_name", nullable = false)
    private String cycleName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppraisalCycleStatus status = AppraisalCycleStatus.DRAFT;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Eligibility Rules (stored as JSON)
    @Column(name = "eligibility_rules", columnDefinition = "TEXT")
    private String eligibilityRules; // JSON: departments, roles, grades, tenure cutoff, exclusions

    // Review Types Configuration (stored as JSON)
    @Column(name = "review_types", columnDefinition = "TEXT")
    private String reviewTypes; // JSON: enabled review types (self, manager, skip, peer, 360)

    // Rating Scale Configuration (stored as JSON)
    @Column(name = "rating_scale", columnDefinition = "TEXT")
    private String ratingScale; // JSON: scale type (numeric/descriptive), min, max, labels

    @Column(name = "forced_distribution_enabled")
    private Boolean forcedDistributionEnabled = false;

    @Column(name = "forced_distribution_rules", columnDefinition = "TEXT")
    private String forcedDistributionRules; // JSON: bell curve percentages

    @Column(name = "created_by", nullable = false, columnDefinition = "CHAR(36)")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AppraisalParticipant> participants;

    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReviewPhase> phases;

    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReviewForm> forms;

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

