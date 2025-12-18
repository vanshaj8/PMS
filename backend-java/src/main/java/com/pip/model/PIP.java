package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "pips")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PIP {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "employee_id", nullable = false, columnDefinition = "CHAR(36)")
    private String employeeId;

    @Column(name = "manager_id", nullable = false, columnDefinition = "CHAR(36)")
    private String managerId;

    @Column(name = "hrbp_id", nullable = false, columnDefinition = "CHAR(36)")
    private String hrbpId;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "supporting_documents", columnDefinition = "TEXT")
    private String supportingDocuments; // JSON array as string

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Goal> goals;

    @Embedded
    private PIPTimeline timeline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PIPStatus status;

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PIPStep> steps;

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CheckIn> checkIns;

    @Column(name = "final_outcome")
    @Enumerated(EnumType.STRING)
    private FinalOutcome finalOutcome;

    @Column(name = "final_remarks", columnDefinition = "TEXT")
    private String finalRemarks;

    @Column(nullable = false)
    private Boolean locked = false;

    @Column(nullable = false)
    private Integer version = 1;

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
        version++;
    }
}

