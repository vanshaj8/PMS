package com.pip.core.service;

import com.pip.core.model.*;
import com.pip.core.repository.WorkflowPhaseRepository;
import com.pip.core.repository.WorkflowStepRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Unified Workflow Engine
 * Supports both sequential (PIP) and phase-based (Appraisal) workflows
 */
@Service
public class WorkflowEngine {
    @Autowired
    private WorkflowPhaseRepository phaseRepository;

    @Autowired
    private WorkflowStepRepository stepRepository;

    @Autowired
    private DeadlineCalculationService deadlineService;

    @Autowired
    private AuditService auditService;

    @Autowired(required = false)
    private com.pip.goals.service.GoalService goalService;

    /**
     * Initialize workflow phases for a context
     */
    @Transactional
    public List<WorkflowPhase> initializeWorkflow(
            String workflowId,
            WorkflowContext context,
            WorkflowType type,
            List<PhaseDefinition> phaseDefinitions) {
        
        List<WorkflowPhase> phases = new ArrayList<>();
        
        for (int i = 0; i < phaseDefinitions.size(); i++) {
            PhaseDefinition def = phaseDefinitions.get(i);
            
            WorkflowPhase phase = new WorkflowPhase();
            phase.setWorkflowId(workflowId);
            phase.setWorkflowContext(context);
            phase.setPhaseName(def.getName());
            phase.setPhaseKey(def.getKey());
            phase.setSequenceOrder(i + 1);
            phase.setCanRunParallel(type == WorkflowType.PHASE_BASED && def.isCanRunParallel());
            phase.setStatus(PhaseStatus.PENDING);
            phase.setAssignedRole(def.getAssignedRole());
            phase.setAutoLockAfterDeadline(def.isAutoLockAfterDeadline());
            phase.setBufferDays(def.getBufferDays());
            
            // Calculate dates
            if (def.getStartDate() != null) {
                phase.setStartDate(def.getStartDate());
            }
            if (def.getEndDate() != null) {
                phase.setEndDate(def.getEndDate());
                phase.setDueDate(def.getEndDate());
            }
            
            WorkflowPhase savedPhase = phaseRepository.save(phase);
            
            // Lock goals if phase requires it (e.g., GOAL_LOCK phase)
            if (def.isLockGoals() && goalService != null) {
                String lockReason = "Goals locked for phase: " + def.getName();
                lockGoalsForPhase(savedPhase.getId(), workflowId, context, "SYSTEM", lockReason);
            }
            
            // Initialize steps if provided
            if (def.getSteps() != null) {
                for (StepDefinition stepDef : def.getSteps()) {
                    WorkflowStep step = new WorkflowStep();
                    step.setPhase(savedPhase);
                    step.setStepName(stepDef.getName());
                    step.setStepKey(stepDef.getKey());
                    step.setStatus(StepStatus.PENDING);
                    if (stepDef.getDueDate() != null) {
                        step.setDueDate(stepDef.getDueDate());
                    }
                    stepRepository.save(step);
                }
            }
            
            phases.add(savedPhase);
        }
        
        // Audit
        auditService.logAction(
            context,
            workflowId,
            "WORKFLOW_INITIALIZED",
            "WorkflowPhase",
            null,
            null,
            Map.of("type", type.name(), "phases", phases.size())
        );
        
        return phases;
    }

    /**
     * Complete a phase
     */
    @Transactional
    public WorkflowPhase completePhase(String phaseId, String userId, String comments) {
        WorkflowPhase phase = phaseRepository.findById(phaseId)
            .orElseThrow(() -> new RuntimeException("Phase not found"));
        
        if (phase.getIsLocked()) {
            throw new RuntimeException("Phase is locked and cannot be completed");
        }
        
        // Validate prerequisites for sequential workflows
        if (!phase.getCanRunParallel()) {
            validateSequentialPrerequisites(phase);
        }
        
        phase.setStatus(PhaseStatus.COMPLETED);
        phase.setCompletedAt(LocalDateTime.now());
        phase.setIsLocked(true);
        phase.setLockedAt(LocalDateTime.now());
        
        // Complete all steps in phase
        if (phase.getSteps() != null) {
            for (WorkflowStep step : phase.getSteps()) {
                if (step.getStatus() != StepStatus.COMPLETED) {
                    step.setStatus(StepStatus.COMPLETED);
                    step.setCompletedDate(LocalDate.now());
                    step.setCompletedBy(userId);
                    step.setComments(comments);
                    stepRepository.save(step);
                }
            }
        }
        
        WorkflowPhase saved = phaseRepository.save(phase);
        
        // Audit
        auditService.logAction(
            phase.getWorkflowContext(),
            phase.getWorkflowId(),
            "PHASE_COMPLETED",
            "WorkflowPhase",
            phaseId,
            userId,
            Map.of("phaseName", phase.getPhaseName(), "comments", comments != null ? comments : "")
        );
        
        // Auto-advance to next phase for sequential workflows
        if (!phase.getCanRunParallel()) {
            autoAdvanceNextPhase(phase);
        }
        
        return saved;
    }

    /**
     * Lock a phase after deadline
     */
    @Transactional
    public void lockOverduePhases() {
        LocalDate today = LocalDate.now();
        List<WorkflowPhase> overduePhases = phaseRepository.findAll().stream()
            .filter(p -> !p.getIsLocked() && 
                       p.getDueDate() != null && 
                       p.getDueDate().isBefore(today) &&
                       p.getAutoLockAfterDeadline())
            .collect(Collectors.toList());
        
        for (WorkflowPhase phase : overduePhases) {
            phase.setStatus(PhaseStatus.OVERDUE);
            phase.setIsLocked(true);
            phase.setLockedAt(LocalDateTime.now());
            phaseRepository.save(phase);
            
            auditService.logAction(
                phase.getWorkflowContext(),
                phase.getWorkflowId(),
                "PHASE_AUTO_LOCKED",
                "WorkflowPhase",
                phase.getId(),
                "SYSTEM",
                Map.of("reason", "Deadline passed", "dueDate", phase.getDueDate().toString())
            );
        }
    }

    private void validateSequentialPrerequisites(WorkflowPhase phase) {
        List<WorkflowPhase> previousPhases = phaseRepository.findByWorkflowIdAndSequenceOrderLessThan(
            phase.getWorkflowId(), phase.getSequenceOrder());
        
        for (WorkflowPhase prev : previousPhases) {
            if (prev.getStatus() != PhaseStatus.COMPLETED) {
                throw new RuntimeException(
                    "Cannot complete phase " + phase.getPhaseName() + 
                    ". Previous phase " + prev.getPhaseName() + " is not completed.");
            }
        }
    }

    private void autoAdvanceNextPhase(WorkflowPhase completedPhase) {
        WorkflowPhase nextPhase = phaseRepository
            .findByWorkflowIdAndSequenceOrder(completedPhase.getWorkflowId(), 
                                             completedPhase.getSequenceOrder() + 1)
            .orElse(null);
        
        if (nextPhase != null && nextPhase.getStatus() == PhaseStatus.PENDING) {
            nextPhase.setStatus(PhaseStatus.IN_PROGRESS);
            phaseRepository.save(nextPhase);
        }
    }

    /**
     * Lock goals when phase starts (for GOAL_LOCK phase)
     */
    @Transactional
    public void lockGoalsForPhase(String phaseId, String workflowId, WorkflowContext context, String lockedBy, String lockReason) {
        if (goalService == null) {
            return; // GoalService not available
        }

        // Get goal IDs from context
        List<String> goalIds = getGoalIdsForWorkflow(workflowId, context);
        
        for (String goalId : goalIds) {
            try {
                goalService.lockGoal(goalId, lockedBy, lockReason);
            } catch (Exception e) {
                // Log but don't fail the phase
                auditService.logAction(
                    context,
                    workflowId,
                    "GOAL_LOCK_FAILED",
                    "Goal",
                    goalId,
                    lockedBy,
                    Map.of("error", e.getMessage())
                );
            }
        }
    }

    /**
     * Get goal IDs for a workflow
     */
    private List<String> getGoalIdsForWorkflow(String workflowId, WorkflowContext context) {
        List<String> goalIds = new ArrayList<>();
        
        if (context == WorkflowContext.PIP) {
            // Get goals from PIP goal links
            if (goalService != null) {
                try {
                    // This would need to be implemented in GoalService
                    // For now, return empty list
                } catch (Exception e) {
                    // Handle error
                }
            }
        } else if (context == WorkflowContext.APPRAISAL) {
            // Get goals from appraisal participant
            // This would need to query appraisal_goal_snapshots or goal_context_links
        }
        
        return goalIds;
    }

    // DTOs
    public static class PhaseDefinition {
        private String name;
        private String key;
        private String assignedRole;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer bufferDays = 0;
        private boolean autoLockAfterDeadline = true;
        private boolean canRunParallel = false;
        private boolean lockGoals = false; // NEW: Flag to lock goals when phase starts
        private List<StepDefinition> steps;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }
        public String getAssignedRole() { return assignedRole; }
        public void setAssignedRole(String assignedRole) { this.assignedRole = assignedRole; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public Integer getBufferDays() { return bufferDays; }
        public void setBufferDays(Integer bufferDays) { this.bufferDays = bufferDays; }
        public boolean isAutoLockAfterDeadline() { return autoLockAfterDeadline; }
        public void setAutoLockAfterDeadline(boolean autoLockAfterDeadline) { this.autoLockAfterDeadline = autoLockAfterDeadline; }
        public boolean isCanRunParallel() { return canRunParallel; }
        public void setCanRunParallel(boolean canRunParallel) { this.canRunParallel = canRunParallel; }
        public boolean isLockGoals() { return lockGoals; }
        public void setLockGoals(boolean lockGoals) { this.lockGoals = lockGoals; }
        public List<StepDefinition> getSteps() { return steps; }
        public void setSteps(List<StepDefinition> steps) { this.steps = steps; }
    }

    public static class StepDefinition {
        private String name;
        private String key;
        private LocalDate dueDate;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }
        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    }
}

