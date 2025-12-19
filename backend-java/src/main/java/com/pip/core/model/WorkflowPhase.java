package com.pip.core.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Unified workflow phase - supports both sequential (PIP) and phase-based (Appraisal) workflows
 */
@Entity
@Table(name = "workflow_phases")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowPhase extends BaseEntity {
    @Column(name = "workflow_id", nullable = false, columnDefinition = "CHAR(36)")
    private String workflowId; // References PIP or AppraisalCycle

    @Enumerated(EnumType.STRING)
    @Column(name = "workflow_context", nullable = false)
    private WorkflowContext workflowContext;

    @Column(name = "phase_name", nullable = false)
    private String phaseName;

    @Column(name = "phase_key", nullable = false)
    private String phaseKey; // Unique key within workflow (e.g., "EMPLOYEE_ACKNOWLEDGEMENT", "SELF_REVIEW")

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder; // For sequential workflows

    @Column(name = "can_run_parallel")
    private Boolean canRunParallel = false; // For phase-based workflows

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "buffer_days")
    private Integer bufferDays = 0;

    @Column(name = "auto_lock_after_deadline")
    private Boolean autoLockAfterDeadline = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PhaseStatus status = PhaseStatus.PENDING;

    @Column(name = "is_locked")
    private Boolean isLocked = false;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "assigned_role")
    private String assignedRole; // Role required to complete this phase

    @Column(name = "assigned_user_id", columnDefinition = "CHAR(36)")
    private String assignedUserId; // Specific user assigned (optional)

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON for phase-specific data

    @OneToMany(mappedBy = "phase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkflowStep> steps;
}

