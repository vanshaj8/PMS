package com.pip.service;

import com.pip.model.Goal;
import com.pip.model.GoalStatus;
import com.pip.model.PIP;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for calculating PIP success criteria and scores
 */
@Service
public class SuccessCriteriaService {
    
    /**
     * Calculate success score based on goal weightages and statuses
     * Scoring:
     * - ACHIEVED: 100% of weightage
     * - PARTIALLY_ACHIEVED: 50% of weightage
     * - NOT_ACHIEVED: 0% of weightage
     */
    public double calculateSuccessScore(PIP pip) {
        if (pip.getGoals() == null || pip.getGoals().isEmpty()) {
            return 0.0;
        }
        
        double totalScore = 0.0;
        double totalWeightage = 0.0;
        
        for (Goal goal : pip.getGoals()) {
            double weightage = goal.getWeightage() != null ? goal.getWeightage() : 0.0;
            totalWeightage += weightage;
            
            if (goal.getStatus() != null) {
                switch (goal.getStatus()) {
                    case ACHIEVED:
                        totalScore += weightage; // 100% of weightage
                        break;
                    case PARTIALLY_ACHIEVED:
                        totalScore += weightage * 0.5; // 50% of weightage
                        break;
                    case NOT_ACHIEVED:
                        totalScore += 0.0; // 0% of weightage
                        break;
                }
            }
        }
        
        if (totalWeightage == 0) {
            return 0.0;
        }
        
        return (totalScore / totalWeightage) * 100.0;
    }
    
    /**
     * Get success criteria metadata
     */
    public Map<String, Object> getSuccessCriteria(PIP pip, double minScore) {
        double actualScore = calculateSuccessScore(pip);
        
        Map<String, Object> criteria = new HashMap<>();
        criteria.put("minScore", minScore);
        criteria.put("actualScore", Math.round(actualScore * 100.0) / 100.0);
        criteria.put("rule", "weighted_average");
        criteria.put("meetsCriteria", actualScore >= minScore);
        
        // Goal breakdown
        Map<String, Object> goalBreakdown = new HashMap<>();
        for (Goal goal : pip.getGoals()) {
            Map<String, Object> goalData = new HashMap<>();
            goalData.put("title", goal.getTitle());
            goalData.put("weightage", goal.getWeightage());
            goalData.put("status", goal.getStatus());
            
            double goalScore = 0.0;
            if (goal.getStatus() == GoalStatus.ACHIEVED) {
                goalScore = goal.getWeightage();
            } else if (goal.getStatus() == GoalStatus.PARTIALLY_ACHIEVED) {
                goalScore = goal.getWeightage() * 0.5;
            }
            goalData.put("score", goalScore);
            
            goalBreakdown.put(goal.getId(), goalData);
        }
        criteria.put("goalBreakdown", goalBreakdown);
        
        return criteria;
    }
    
    /**
     * Default minimum score for success (70%)
     */
    public double getDefaultMinScore() {
        return 70.0;
    }
}

