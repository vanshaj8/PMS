package com.pip.core.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Unified Review entity - supports reviews across all contexts
 */
@Entity
@Table(name = "unified_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnifiedReview extends BaseEntity {
    @Enumerated(EnumType.STRING)
    @Column(name = "review_context", nullable = false)
    private WorkflowContext reviewContext;

    @Column(name = "context_id", nullable = false, columnDefinition = "CHAR(36)")
    private String contextId; // PIP ID, AppraisalParticipant ID, etc.

    @Enumerated(EnumType.STRING)
    @Column(name = "review_type", nullable = false)
    private ReviewType reviewType;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_role", nullable = false)
    private ReviewRole reviewRole;

    @Column(name = "reviewer_id", nullable = false, columnDefinition = "CHAR(36)")
    private String reviewerId;

    @Column(name = "reviewee_id", nullable = false, columnDefinition = "CHAR(36)")
    private String revieweeId; // Employee being reviewed

    @Column(name = "form_id", columnDefinition = "CHAR(36)")
    private String formId; // Reference to review form template

    @Column(name = "responses", columnDefinition = "TEXT", nullable = false)
    private String responses; // JSON: { sectionId: { questionId: answer } }

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReviewStatus status = ReviewStatus.DRAFT;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "is_locked")
    private Boolean isLocked = false;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON for review-specific data
}

