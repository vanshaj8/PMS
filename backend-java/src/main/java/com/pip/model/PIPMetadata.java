package com.pip.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Metadata for PIP tracking and compliance
 * Embedded in PIP entity
 */
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PIPMetadata {
    
    // Escalation metadata for employee acknowledgement
    @Column(name = "ack_escalation_triggered", columnDefinition = "TEXT")
    private String ackEscalationMetadata; // JSON: { "deadline": "...", "gracePeriod": 2, "escalationsTriggered": false, "remindersSent": [] }
    
    // Check-in validation metadata
    @Column(name = "checkin_validation_metadata", columnDefinition = "TEXT")
    private String checkInValidationMetadata; // JSON: { "countValid": 3, "outsideWindow": 0, "activePeriodStart": "...", "activePeriodEnd": "..." }
    
    // Success criteria metadata
    @Column(name = "success_criteria_metadata", columnDefinition = "TEXT")
    private String successCriteriaMetadata; // JSON: { "minScore": 70, "actualScore": 85, "rule": "weighted_average", "meetsCriteria": true }
    
    // Extension policy metadata
    @Column(name = "extension_policy_metadata", columnDefinition = "TEXT")
    private String extensionPolicyMetadata; // JSON: { "maxAllowed": 1, "used": 0, "eligibility": true }
    
    // Timeline versioning
    @Column(name = "timeline_versions", columnDefinition = "TEXT")
    private String timelineVersions; // JSON array: [{ "version": 1, "reason": "HRBP approval", "timestamp": "..." }]
    
    // SLA attribution
    @Column(name = "sla_attribution", columnDefinition = "TEXT")
    private String slaAttribution; // JSON: { "hrbpReview": { "delayAttribution": "HRBP", "delayDays": 0 }, ... }
    
    // Compliance mode
    @Column(name = "compliance_mode")
    private String complianceMode = "STANDARD"; // STANDARD, STRICT, LOCAL_LAW
}

