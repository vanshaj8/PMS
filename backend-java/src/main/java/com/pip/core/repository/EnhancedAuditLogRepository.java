package com.pip.core.repository;

import com.pip.core.model.EnhancedAuditLog;
import com.pip.core.model.WorkflowContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EnhancedAuditLogRepository extends JpaRepository<EnhancedAuditLog, String> {
    List<EnhancedAuditLog> findByContextAndContextId(WorkflowContext context, String contextId);
    List<EnhancedAuditLog> findByUserId(String userId);
    List<EnhancedAuditLog> findByEntityTypeAndEntityId(String entityType, String entityId);
}

