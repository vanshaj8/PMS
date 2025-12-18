package com.pip.service;

import com.pip.model.DeadlinePolicy;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service for managing deadline policies
 * In a full implementation, this would load from database
 * For now, returns default policy
 */
@Service
public class DeadlinePolicyService {
    
    /**
     * Get active deadline policy
     * TODO: Load from database, support multiple policies
     */
    public DeadlinePolicy getActivePolicy() {
        // Return default policy
        // In production, this would query the database
        DeadlinePolicy policy = new DeadlinePolicy();
        policy.setPolicyName("STANDARD_PIP");
        policy.setActive(true);
        
        // Set defaults (matching the model defaults)
        // These can be overridden by database values
        
        return policy;
    }
    
    /**
     * Get policy by name
     */
    public Optional<DeadlinePolicy> getPolicyByName(String policyName) {
        // TODO: Implement database lookup
        if ("STANDARD_PIP".equals(policyName)) {
            return Optional.of(getActivePolicy());
        }
        return Optional.empty();
    }
    
    /**
     * Validate deadline value against policy
     */
    public boolean validateDeadlineValue(String deadlineType, int days, DeadlinePolicy policy) {
        switch (deadlineType) {
            case "hrbp_review":
                return days >= policy.getHrbpReviewMinDays() && days <= policy.getHrbpReviewMaxDays();
            case "employee_ack":
                return days >= policy.getEmployeeAckMinDays() && days <= policy.getEmployeeAckMaxDays();
            case "active_duration":
                return days >= policy.getActiveDurationMinDays() && days <= policy.getActiveDurationMaxDays();
            case "self_review_buffer":
                return days >= policy.getSelfReviewBufferMinDays() && days <= policy.getSelfReviewBufferMaxDays();
            case "manager_review_buffer":
                return days >= policy.getManagerReviewBufferMinDays() && days <= policy.getManagerReviewBufferMaxDays();
            case "hrbp_decision_buffer":
                return days >= policy.getHrbpDecisionBufferMinDays() && days <= policy.getHrbpDecisionBufferMaxDays();
            default:
                return false;
        }
    }
}

