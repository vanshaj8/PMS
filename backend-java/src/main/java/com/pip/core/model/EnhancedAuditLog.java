package com.pip.core.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Enhanced audit log with field-level tracking and immutable records
 */
@Entity
@Table(name = "enhanced_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnhancedAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "context", nullable = false)
    private WorkflowContext context;

    @Column(name = "context_id", nullable = false, columnDefinition = "CHAR(36)")
    private String contextId;

    @Column(name = "action", nullable = false, length = 100)
    private String action; // CREATE, UPDATE, DELETE, APPROVE, REJECT, etc.

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType; // PIP, GOAL, REVIEW, RATING, etc.

    @Column(name = "entity_id", columnDefinition = "CHAR(36)")
    private String entityId;

    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)")
    private String userId;

    @Column(name = "user_role", length = 50)
    private String userRole;

    @Column(name = "field_changes", columnDefinition = "TEXT")
    private String fieldChanges; // JSON: { field: { old: value, new: value } }

    @Column(name = "override_reason", columnDefinition = "TEXT")
    private String overrideReason; // Mandatory for overrides

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON for additional context

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Immutable - no update timestamp, no setters for createdAt
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

