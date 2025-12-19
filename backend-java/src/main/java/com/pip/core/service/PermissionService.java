package com.pip.core.service;

import com.pip.core.model.WorkflowContext;
import com.pip.model.User;
import com.pip.model.UserRole;
import com.pip.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Centralized RBAC/Permission Service
 */
@Service
public class PermissionService {
    @Autowired
    private UserRepository userRepository;

    /**
     * Check if user can perform action on context
     */
    public boolean canPerformAction(String userId, String action, WorkflowContext context, String contextId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }
        
        User user = userOpt.get();
        UserRole role = user.getRole();
        
        // Admin can do everything
        if (role == UserRole.ADMIN) {
            return true;
        }
        
        // Get permissions for role and context
        Set<String> permissions = getPermissionsForRole(role, context);
        
        return permissions.contains(action) || permissions.contains("*");
    }

    /**
     * Check if user can access context
     */
    public boolean canAccessContext(String userId, WorkflowContext context, String contextId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }
        
        User user = userOpt.get();
        UserRole role = user.getRole();
        
        if (role == UserRole.ADMIN) {
            return true;
        }
        
        // Context-specific access checks
        switch (context) {
            case PIP:
                return canAccessPIP(user, contextId);
            case APPRAISAL:
                return canAccessAppraisal(user, contextId);
            default:
                return false;
        }
    }

    /**
     * Get all permissions for a role in a context
     */
    public Set<String> getPermissionsForRole(UserRole role, WorkflowContext context) {
        Map<UserRole, Map<WorkflowContext, Set<String>>> permissions = getPermissionMatrix();
        
        return permissions.getOrDefault(role, Collections.emptyMap())
            .getOrDefault(context, Collections.emptySet());
    }

    private boolean canAccessPIP(User user, String pipId) {
        // Implementation would check if user is employee, manager, or HRBP of the PIP
        // This is a simplified version
        return user.getRole() == UserRole.HRBP || 
               user.getRole() == UserRole.MANAGER ||
               user.getRole() == UserRole.EMPLOYEE;
    }

    private boolean canAccessAppraisal(User user, String appraisalId) {
        // Implementation would check if user is participant, manager, or HRBP
        return user.getRole() == UserRole.HRBP || 
               user.getRole() == UserRole.MANAGER ||
               user.getRole() == UserRole.EMPLOYEE;
    }

    /**
     * Permission matrix: Role -> Context -> Actions
     */
    private Map<UserRole, Map<WorkflowContext, Set<String>>> getPermissionMatrix() {
        Map<UserRole, Map<WorkflowContext, Set<String>>> matrix = new HashMap<>();
        
        // Admin - all permissions
        matrix.put(UserRole.ADMIN, Map.of(
            WorkflowContext.PIP, Set.of("*"),
            WorkflowContext.APPRAISAL, Set.of("*")
        ));
        
        // HRBP - broad permissions
        matrix.put(UserRole.HRBP, Map.of(
            WorkflowContext.PIP, Set.of("VIEW", "APPROVE", "REJECT", "DECIDE", "EXTEND"),
            WorkflowContext.APPRAISAL, Set.of("VIEW", "CALIBRATE", "FINALIZE", "RELEASE")
        ));
        
        // Manager - moderate permissions
        matrix.put(UserRole.MANAGER, Map.of(
            WorkflowContext.PIP, Set.of("CREATE", "VIEW", "REVIEW", "UPDATE"),
            WorkflowContext.APPRAISAL, Set.of("VIEW", "REVIEW", "SUBMIT")
        ));
        
        // Employee - limited permissions
        matrix.put(UserRole.EMPLOYEE, Map.of(
            WorkflowContext.PIP, Set.of("VIEW", "ACKNOWLEDGE", "SUBMIT_REVIEW"),
            WorkflowContext.APPRAISAL, Set.of("VIEW", "SUBMIT_REVIEW", "ACKNOWLEDGE")
        ));
        
        return matrix;
    }
}

