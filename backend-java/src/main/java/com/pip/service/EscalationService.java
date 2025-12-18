package com.pip.service;

import com.pip.model.*;
import com.pip.repository.PIPRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Service for handling deadline escalations
 * Monitors overdue steps and escalates appropriately
 */
@Service
public class EscalationService {
    
    @Autowired
    private PIPRepository pipRepository;
    
    @Autowired
    private DeadlinePolicyService deadlinePolicyService;
    
    @Autowired
    private DeadlineCalculationService deadlineCalculationService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    
    /**
     * Check and handle overdue steps
     * Should be called periodically (e.g., via scheduled task)
     */
    @Transactional
    public void checkAndEscalateOverdueSteps() {
        List<PIP> allPIPs = pipRepository.findAll();
        DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();
        LocalDateTime now = LocalDateTime.now();
        
        for (PIP pip : allPIPs) {
            if (pip.getLocked() || pip.getStatus() == PIPStatus.COMPLETED || 
                pip.getStatus() == PIPStatus.CANCELLED) {
                continue;
            }
            
            checkEmployeeAcknowledgement(pip, now, policy);
            checkManagerReview(pip, now, policy);
            checkHrbpDecision(pip, now, policy);
        }
    }
    
    /**
     * Check employee acknowledgement deadline
     */
    private void checkEmployeeAcknowledgement(PIP pip, LocalDateTime now, DeadlinePolicy policy) {
        if (pip.getStatus() != PIPStatus.PENDING_EMPLOYEE_ACKNOWLEDGEMENT) {
            return;
        }
        
        Optional<PIPStep> ackStep = pip.getSteps().stream()
            .filter(s -> s.getStep() == StepName.EMPLOYEE_ACKNOWLEDGEMENT)
            .findFirst();
        
        if (ackStep.isPresent() && ackStep.get().getStatus() == StepStatus.PENDING) {
            LocalDateTime deadline = LocalDateTime.parse(ackStep.get().getDueDate(), DATE_FORMATTER);
            
            if (now.isAfter(deadline)) {
                // Mark as overdue
                ackStep.get().setStatus(StepStatus.OVERDUE);
                pip.setStatus(PIPStatus.OVERDUE_EMPLOYEE_ACKNOWLEDGEMENT);
                
                // Check escalation threshold
                long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(deadline, now);
                
                if (daysOverdue >= policy.getEscalationToHrbpDays()) {
                    // Escalate to HRBP - can mark as "Deemed Acknowledged"
                    // This would trigger notification to HRBP
                }
                
                pipRepository.save(pip);
            }
        }
    }
    
    /**
     * Check manager review deadline
     */
    private void checkManagerReview(PIP pip, LocalDateTime now, DeadlinePolicy policy) {
        if (pip.getStatus() != PIPStatus.PENDING_MANAGER_REVIEW) {
            return;
        }
        
        Optional<PIPStep> managerStep = pip.getSteps().stream()
            .filter(s -> s.getStep() == StepName.MANAGER_REVIEW)
            .findFirst();
        
        if (managerStep.isPresent() && managerStep.get().getStatus() == StepStatus.PENDING) {
            LocalDateTime deadline = LocalDateTime.parse(managerStep.get().getDueDate(), DATE_FORMATTER);
            
            if (now.isAfter(deadline)) {
                managerStep.get().setStatus(StepStatus.OVERDUE);
                pip.setStatus(PIPStatus.OVERDUE_MANAGER_REVIEW);
                
                long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(deadline, now);
                
                if (daysOverdue >= policy.getEscalationToHrbpDays()) {
                    // Escalate to HRBP - can take over review
                    // This would trigger notification
                }
                
                pipRepository.save(pip);
            }
        }
    }
    
    /**
     * Check HRBP decision deadline
     */
    private void checkHrbpDecision(PIP pip, LocalDateTime now, DeadlinePolicy policy) {
        if (pip.getStatus() != PIPStatus.PENDING_HRBP_DECISION) {
            return;
        }
        
        Optional<PIPStep> hrbpStep = pip.getSteps().stream()
            .filter(s -> s.getStep() == StepName.HRBP_DECISION)
            .findFirst();
        
        if (hrbpStep.isPresent() && hrbpStep.get().getStatus() == StepStatus.PENDING) {
            LocalDateTime deadline = LocalDateTime.parse(hrbpStep.get().getDueDate(), DATE_FORMATTER);
            
            if (now.isAfter(deadline)) {
                hrbpStep.get().setStatus(StepStatus.OVERDUE);
                pip.setStatus(PIPStatus.OVERDUE_HRBP_DECISION);
                
                long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(deadline, now);
                
                if (daysOverdue >= policy.getEscalationToAdminDays()) {
                    // Escalate to admin
                    pip.setStatus(PIPStatus.ADMIN_INTERVENTION_REQUIRED);
                    // This would trigger notification to admin
                }
                
                pipRepository.save(pip);
            }
        }
    }
    
    /**
     * Mark employee acknowledgement as "Deemed Acknowledged" by HRBP
     */
    @Transactional
    public PIP deemAcknowledged(String pipId, String hrbpId, String comments) {
        PIP pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new RuntimeException("PIP not found"));
        
        if (!pip.getHrbpId().equals(hrbpId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        if (pip.getStatus() != PIPStatus.OVERDUE_EMPLOYEE_ACKNOWLEDGEMENT) {
            throw new RuntimeException("PIP is not in overdue acknowledgement status");
        }
        
        PIPStep ackStep = pip.getSteps().stream()
            .filter(s -> s.getStep() == StepName.EMPLOYEE_ACKNOWLEDGEMENT)
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Acknowledgement step not found"));
        
        LocalDateTime now = LocalDateTime.now();
        ackStep.setStatus(StepStatus.COMPLETED);
        ackStep.setCompletedDate(now.format(DATE_FORMATTER));
        ackStep.setSignedBy(hrbpId);
        ackStep.setComments("Deemed Acknowledged by HRBP: " + (comments != null ? comments : ""));
        
        pip.setEmployeeAcknowledgedAt(now);
        pip.setActivePeriodStartedAt(now);
        pip.setStatus(PIPStatus.ACTIVE);
        
        // Recalculate deadlines
        DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();
        deadlineCalculationService.recalculateDeadlines(pip, policy);
        
        pip.setVersion(pip.getVersion() + 1);
        return pipRepository.save(pip);
    }
}

