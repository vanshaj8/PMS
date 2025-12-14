package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double weightage;

    @Column(name = "expected_outcome")
    private String expectedOutcome;

    @Column(name = "target_timeline")
    private String targetTimeline;

    private String deadline;

    @Column(columnDefinition = "TEXT")
    private String justification;

    @Column(name = "employee_attachments", columnDefinition = "TEXT")
    private String employeeAttachments; // JSON array as string

    @Enumerated(EnumType.STRING)
    private GoalStatus status = GoalStatus.NOT_ACHIEVED;

    @Column(name = "manager_comments", columnDefinition = "TEXT")
    private String managerComments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pip_id")
    @JsonIgnore
    private PIP pip;
}

