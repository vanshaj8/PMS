package com.pip.service;

import com.pip.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

/**
 * Service for calculating PIP deadlines based on policy and actual timestamps
 * Implements derived deadline logic
 */
@Service
public class DeadlineCalculationService {
    
    @Autowired
    private BusinessDayService businessDayService;
    
    @Autowired
    private DeadlinePolicyService deadlinePolicyService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    
    /**
     * Parse a date string that can be either DATE (YYYY-MM-DD) or DATETIME (YYYY-MM-DDTHH:mm:ss) format
     */
    private LocalDateTime parseDateString(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        // Handle both DATE (YYYY-MM-DD) and DATETIME (YYYY-MM-DDTHH:mm:ss) formats
        if (dateStr.length() == 10) {
            // DATE format: YYYY-MM-DD
            return LocalDate.parse(dateStr).atStartOfDay();
        } else {
            // DATETIME format: YYYY-MM-DDTHH:mm:ss
            return LocalDateTime.parse(dateStr, DATE_FORMATTER);
        }
    }
    
    /**
     * Calculate HRBP initial review deadline
     */
    public LocalDateTime calculateHrbpReviewDeadline(LocalDateTime createdAt, DeadlinePolicy policy) {
        int days = policy.getHrbpReviewDefaultDays();
        boolean businessDaysOnly = policy.getHrbpReviewBusinessDaysOnly();
        return businessDayService.addDays(createdAt, days, businessDaysOnly);
    }
    
    /**
     * Calculate employee acknowledgement deadline
     * Based on HRBP approval time (not creation time) to handle delays
     */
    public LocalDateTime calculateEmployeeAckDeadline(LocalDateTime hrbpApprovedAt, DeadlinePolicy policy) {
        int days = policy.getEmployeeAckDefaultDays();
        boolean businessDaysOnly = policy.getEmployeeAckBusinessDaysOnly();
        return businessDayService.addDays(hrbpApprovedAt, days, businessDaysOnly);
    }
    
    /**
     * Calculate active period end date
     * Based on actual acknowledgement timestamp
     */
    public LocalDateTime calculateActivePeriodEnd(LocalDateTime acknowledgedAt, int activeDurationDays, DeadlinePolicy policy) {
        boolean businessDaysOnly = policy.getActiveDurationBusinessDaysOnly();
        return businessDayService.addDays(acknowledgedAt, activeDurationDays, businessDaysOnly);
    }
    
    /**
     * Calculate employee self-review deadline
     * Based on active period end + buffer
     */
    public LocalDateTime calculateSelfReviewDeadline(LocalDateTime activePeriodEnd, DeadlinePolicy policy) {
        int bufferDays = policy.getSelfReviewBufferDefaultDays();
        boolean businessDaysOnly = policy.getSelfReviewBufferBusinessDaysOnly();
        return businessDayService.addDays(activePeriodEnd, bufferDays, businessDaysOnly);
    }
    
    /**
     * Calculate manager review deadline
     * Based on self-review submission time + buffer
     */
    public LocalDateTime calculateManagerReviewDeadline(LocalDateTime selfReviewSubmittedAt, DeadlinePolicy policy) {
        int bufferDays = policy.getManagerReviewBufferDefaultDays();
        boolean businessDaysOnly = policy.getManagerReviewBufferBusinessDaysOnly();
        return businessDayService.addDays(selfReviewSubmittedAt, bufferDays, businessDaysOnly);
    }
    
    /**
     * Calculate HRBP final decision deadline
     * Based on manager review completion time + buffer
     */
    public LocalDateTime calculateHrbpDecisionDeadline(LocalDateTime managerReviewCompletedAt, DeadlinePolicy policy) {
        int bufferDays = policy.getHrbpDecisionBufferDefaultDays();
        boolean businessDaysOnly = policy.getHrbpDecisionBufferBusinessDaysOnly();
        return businessDayService.addDays(managerReviewCompletedAt, bufferDays, businessDaysOnly);
    }
    
    /**
     * Recalculate all deadlines for a PIP based on actual timestamps
     */
    public void recalculateDeadlines(PIP pip, DeadlinePolicy policy) {
        LocalDateTime createdAt = pip.getCreatedAt();
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        
        // Find step timestamps
        Optional<PIPStep> hrbpReviewStep = pip.getSteps().stream()
            .filter(s -> s.getStep() == StepName.HRBP_REVIEW)
            .findFirst();
        
        Optional<PIPStep> ackStep = pip.getSteps().stream()
            .filter(s -> s.getStep() == StepName.EMPLOYEE_ACKNOWLEDGEMENT)
            .findFirst();
        
        Optional<PIPStep> activeStep = pip.getSteps().stream()
            .filter(s -> s.getStep() == StepName.ACTIVE_PIP)
            .findFirst();
        
        Optional<PIPStep> selfReviewStep = pip.getSteps().stream()
            .filter(s -> s.getStep() == StepName.EMPLOYEE_SELF_REVIEW)
            .findFirst();
        
        Optional<PIPStep> managerReviewStep = pip.getSteps().stream()
            .filter(s -> s.getStep() == StepName.MANAGER_REVIEW)
            .findFirst();
        
        // Calculate HRBP review deadline (if not approved yet)
        if (hrbpReviewStep.isPresent() && hrbpReviewStep.get().getStatus() == StepStatus.PENDING) {
            LocalDateTime hrbpDeadline = calculateHrbpReviewDeadline(createdAt, policy);
            hrbpReviewStep.get().setDueDate(hrbpDeadline.format(DATE_FORMATTER));
        }
        
        // Calculate employee ack deadline (if HRBP approved)
        if (hrbpReviewStep.isPresent() && hrbpReviewStep.get().getStatus() == StepStatus.COMPLETED) {
            LocalDateTime hrbpApprovedAt = parseDateString(hrbpReviewStep.get().getCompletedDate());
            if (hrbpApprovedAt != null) {
                LocalDateTime ackDeadline = calculateEmployeeAckDeadline(hrbpApprovedAt, policy);
                if (ackStep.isPresent() && ackStep.get().getStatus() == StepStatus.PENDING) {
                    ackStep.get().setDueDate(ackDeadline.format(DATE_FORMATTER));
                }
            }
        }
        
        // Calculate active period end (if acknowledged)
        if (ackStep.isPresent() && ackStep.get().getStatus() == StepStatus.COMPLETED) {
            LocalDateTime acknowledgedAt = parseDateString(ackStep.get().getCompletedDate());
            if (acknowledgedAt != null) {
                int activeDuration = pip.getTimeline().getPipActiveDuration();
                LocalDateTime activeEnd = calculateActivePeriodEnd(acknowledgedAt, activeDuration, policy);
                if (activeStep.isPresent() && activeStep.get().getStatus() == StepStatus.PENDING) {
                    activeStep.get().setDueDate(activeEnd.format(DATE_FORMATTER));
                }
            }
        }
        
        // Calculate self-review deadline (if active period ended)
        if (activeStep.isPresent() && activeStep.get().getStatus() == StepStatus.COMPLETED) {
            LocalDateTime activeEnd = parseDateString(activeStep.get().getCompletedDate());
            if (activeEnd != null) {
                LocalDateTime selfReviewDeadline = calculateSelfReviewDeadline(activeEnd, policy);
                if (selfReviewStep.isPresent() && selfReviewStep.get().getStatus() == StepStatus.PENDING) {
                    selfReviewStep.get().setDueDate(selfReviewDeadline.format(DATE_FORMATTER));
                }
            }
        }
        
        // Calculate manager review deadline (if self-review submitted)
        if (selfReviewStep.isPresent() && selfReviewStep.get().getStatus() == StepStatus.COMPLETED) {
            LocalDateTime selfReviewSubmittedAt = parseDateString(selfReviewStep.get().getCompletedDate());
            if (selfReviewSubmittedAt != null) {
                LocalDateTime managerDeadline = calculateManagerReviewDeadline(selfReviewSubmittedAt, policy);
                if (managerReviewStep.isPresent() && managerReviewStep.get().getStatus() == StepStatus.PENDING) {
                    managerReviewStep.get().setDueDate(managerDeadline.format(DATE_FORMATTER));
                }
            }
        }
        
        // Calculate HRBP decision deadline (if manager review completed)
        if (managerReviewStep.isPresent() && managerReviewStep.get().getStatus() == StepStatus.COMPLETED) {
            LocalDateTime managerCompletedAt = parseDateString(managerReviewStep.get().getCompletedDate());
            if (managerCompletedAt != null) {
                Optional<PIPStep> hrbpDecisionStep = pip.getSteps().stream()
                    .filter(s -> s.getStep() == StepName.HRBP_DECISION)
                    .findFirst();
                if (hrbpDecisionStep.isPresent() && hrbpDecisionStep.get().getStatus() == StepStatus.PENDING) {
                    LocalDateTime hrbpDecisionDeadline = calculateHrbpDecisionDeadline(managerCompletedAt, policy);
                    hrbpDecisionStep.get().setDueDate(hrbpDecisionDeadline.format(DATE_FORMATTER));
                }
            }
        }
    }
}

