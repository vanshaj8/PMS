package com.pip.service;

import com.pip.model.*;
import com.pip.util.DateTimeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/**
 * Service for managing PIP metadata (escalation, validation, success criteria, etc.)
 */
@Service
public class PIPMetadataService {
    
    @Autowired
    private SuccessCriteriaService successCriteriaService;
    
    @Autowired
    private DeadlinePolicyService deadlinePolicyService;
    
    /**
     * Create escalation metadata for employee acknowledgement
     */
    public String createAckEscalationMetadata(PIPStep ackStep, DeadlinePolicy policy) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("deadline", ackStep.getDueDate());
        metadata.put("gracePeriod", policy.getGracePeriodDays());
        metadata.put("escalationsTriggered", false);
        metadata.put("remindersSent", new ArrayList<>());
        metadata.put("acknowledgedAt", ackStep.getCompletedDate());
        
        return toJson(metadata);
    }
    
    /**
     * Create check-in validation metadata
     */
    public String createCheckInValidationMetadata(PIP pip) {
        Map<String, Object> metadata = new HashMap<>();
        
        if (pip.getActivePeriodStartedAt() != null && pip.getCheckIns() != null) {
            Instant activeStart = DateTimeUtil.toUTC(pip.getActivePeriodStartedAt());
            Instant activeEnd = pip.getActivePeriodEndedAt() != null ? 
                DateTimeUtil.toUTC(pip.getActivePeriodEndedAt()) : null;
            
            int countValid = 0;
            int outsideWindow = 0;
            List<Map<String, Object>> checkInDetails = new ArrayList<>();
            
            for (CheckIn checkIn : pip.getCheckIns()) {
                Instant checkInDate = DateTimeUtil.parseUTC(checkIn.getDate());
                boolean isValid = true;
                
                if (checkInDate.isBefore(activeStart)) {
                    isValid = false;
                    outsideWindow++;
                }
                if (activeEnd != null && checkInDate.isAfter(activeEnd)) {
                    isValid = false;
                    outsideWindow++;
                }
                
                if (isValid) {
                    countValid++;
                }
                
                Map<String, Object> detail = new HashMap<>();
                detail.put("id", checkIn.getId());
                detail.put("date", checkIn.getDate());
                detail.put("valid", isValid);
                checkInDetails.add(detail);
            }
            
            metadata.put("countValid", countValid);
            metadata.put("outsideWindow", outsideWindow);
            metadata.put("activePeriodStart", DateTimeUtil.formatUTC(activeStart));
            if (activeEnd != null) {
                metadata.put("activePeriodEnd", DateTimeUtil.formatUTC(activeEnd));
            }
            metadata.put("checkInDetails", checkInDetails);
        } else {
            metadata.put("countValid", 0);
            metadata.put("outsideWindow", 0);
        }
        
        return toJson(metadata);
    }
    
    /**
     * Create success criteria metadata
     */
    public String createSuccessCriteriaMetadata(PIP pip) {
        double minScore = successCriteriaService.getDefaultMinScore();
        Map<String, Object> criteria = successCriteriaService.getSuccessCriteria(pip, minScore);
        return toJson(criteria);
    }
    
    /**
     * Create extension policy metadata
     */
    public String createExtensionPolicyMetadata(PIP pip) {
        DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("maxAllowed", policy.getMaxExtensionsAllowed());
        metadata.put("used", pip.getExtensionCount() != null ? pip.getExtensionCount() : 0);
        metadata.put("eligibility", (pip.getExtensionCount() != null ? pip.getExtensionCount() : 0) < policy.getMaxExtensionsAllowed());
        metadata.put("originalDuration", pip.getOriginalActiveDuration());
        metadata.put("currentDuration", pip.getTimeline().getPipActiveDuration());
        
        return toJson(metadata);
    }
    
    /**
     * Add timeline version entry
     */
    public String addTimelineVersion(String existingVersions, String reason, Instant timestamp) {
        List<Map<String, Object>> versions = new ArrayList<>();
        
        if (existingVersions != null && !existingVersions.isEmpty()) {
            try {
                // Parse existing versions (simplified - in production use proper JSON parsing)
                // For now, we'll create a new version entry
            } catch (Exception e) {
                // If parsing fails, start fresh
            }
        }
        
        Map<String, Object> version = new HashMap<>();
        version.put("version", versions.size() + 1);
        version.put("reason", reason);
        version.put("timestamp", DateTimeUtil.formatUTC(timestamp));
        
        versions.add(version);
        return toJson(versions);
    }
    
    /**
     * Create SLA attribution metadata
     */
    public String createSLAAttribution(PIP pip, Map<String, String> delayAttributions) {
        Map<String, Object> attribution = new HashMap<>();
        
        // Add delay attribution for each step
        for (PIPStep step : pip.getSteps()) {
            Map<String, Object> stepAttribution = new HashMap<>();
            String delayAttr = delayAttributions.getOrDefault(step.getStep().name(), "NONE");
            stepAttribution.put("delayAttribution", delayAttr);
            stepAttribution.put("delayDays", 0); // Calculate if needed
            attribution.put(step.getStep().name(), stepAttribution);
        }
        
        return toJson(attribution);
    }
    
    private String toJson(Object obj) {
        // Simple JSON serialization - in production use Jackson ObjectMapper
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}

