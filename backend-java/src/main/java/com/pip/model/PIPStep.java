package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "pip_steps")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PIPStep {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StepName step;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StepStatus status;

    @Column(name = "due_date", nullable = false)
    private String dueDate;

    @Column(name = "completed_date")
    private String completedDate;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "signed_by")
    private String signedBy;

    @Column(name = "pip_id", nullable = false)
    private String pipId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pip_id", insertable = false, updatable = false)
    @JsonIgnore
    private PIP pip;
}

