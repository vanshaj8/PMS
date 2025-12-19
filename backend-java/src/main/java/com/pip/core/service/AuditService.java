package com.pip.core.service;

import com.pip.core.model.*;
import com.pip.core.repository.EnhancedAuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Enhanced Audit Service with field-level tracking
 */
@Service
public class AuditService {
    @Autowired
    private EnhancedAuditLogRepository auditLogRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Log an action with field-level changes
     */
    @Transactional
    public EnhancedAuditLog logAction(
            WorkflowContext context,
            String contextId,
            String action,
            String entityType,
            String entityId,
            String userId,
            Map<String, Object> metadata) {
        
        return logAction(context, contextId, action, entityType, entityId, userId, null, null, metadata);
    }

    /**
     * Log an action with field changes
     */
    @Transactional
    public EnhancedAuditLog logAction(
            WorkflowContext context,
            String contextId,
            String action,
            String entityType,
            String entityId,
            String userId,
            Map<String, Object> fieldChanges,
            String overrideReason,
            Map<String, Object> metadata) {
        
        EnhancedAuditLog log = new EnhancedAuditLog();
        log.setContext(context);
        log.setContextId(contextId);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setUserId(userId);
        
        try {
            if (fieldChanges != null) {
                log.setFieldChanges(objectMapper.writeValueAsString(fieldChanges));
            }
            if (metadata != null) {
                log.setMetadata(objectMapper.writeValueAsString(metadata));
            }
        } catch (Exception e) {
            throw new RuntimeException("Error serializing audit data", e);
        }
        
        log.setOverrideReason(overrideReason);
        
        return auditLogRepository.save(log);
    }

    /**
     * Log field-level changes
     */
    @Transactional
    public EnhancedAuditLog logFieldChanges(
            WorkflowContext context,
            String contextId,
            String entityType,
            String entityId,
            String userId,
            Map<String, FieldChange> fieldChanges,
            String overrideReason) {
        
        Map<String, Object> changes = fieldChanges.entrySet().stream()
            .collect(java.util.stream.Collectors.toMap(
                Map.Entry::getKey,
                e -> Map.of("old", e.getValue().getOldValue(), "new", e.getValue().getNewValue())
            ));
        
        return logAction(context, contextId, "FIELD_UPDATE", entityType, entityId, userId, 
                        changes, overrideReason, null);
    }

    public static class FieldChange {
        private Object oldValue;
        private Object newValue;

        public FieldChange(Object oldValue, Object newValue) {
            this.oldValue = oldValue;
            this.newValue = newValue;
        }

        public Object getOldValue() { return oldValue; }
        public Object getNewValue() { return newValue; }
    }
}

