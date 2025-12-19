package com.pip.goals.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pip.core.model.WorkflowContext;
import com.pip.core.service.AuditService;
import com.pip.goals.model.*;
import com.pip.goals.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Centralized Goals Service
 * Single source of truth for all goals
 */
@Service
public class GoalService {
    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private GoalVersionRepository versionRepository;

    @Autowired
    private GoalContextLinkRepository contextLinkRepository;

    @Autowired
    private PIPGoalLinkRepository pipGoalLinkRepository;

    @Autowired
    private AppraisalGoalSnapshotRepository snapshotRepository;

    @Autowired
    private AuditService auditService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Create a new goal
     */
    @Transactional
    public Goal createGoal(CreateGoalRequest request) {
        Goal goal = new Goal();
        goal.setEmployeeId(request.getEmployeeId());
        goal.setTitle(request.getTitle());
        goal.setDescription(request.getDescription());
        goal.setWeightage(request.getWeightage());
        goal.setGoalType(request.getGoalType());
        goal.setSuccessCriteria(request.getSuccessCriteria());
        goal.setTargetDate(request.getTargetDate());
        goal.setStatus(GoalStatus.ACTIVE);
        goal.setVersionNumber(1);
        goal.setIsCurrentVersion(true);
        goal.setIsLocked(false);
        goal.setCreatedInContext(request.getCreatedInContext());
        goal.setCreatedInContextId(request.getCreatedInContextId());
        goal.setCreatedBy(request.getCreatedBy());

        Goal saved = goalRepository.save(goal);

        // Create initial version
        createVersion(saved, "Initial version", request.getCreatedBy());

        // Audit
        auditService.logAction(
            WorkflowContext.APPRAISAL, // Default context
            request.getEmployeeId(),
            "GOAL_CREATED",
            "Goal",
            saved.getId(),
            request.getCreatedBy(),
            Map.of("title", saved.getTitle(), "type", saved.getGoalType().name())
        );

        return saved;
    }

    /**
     * Update goal - creates new version if locked or used in completed cycle
     */
    @Transactional
    public Goal updateGoal(String goalId, UpdateGoalRequest request) {
        Goal goal = goalRepository.findById(goalId)
            .orElseThrow(() -> new RuntimeException("Goal not found"));

        // Check if goal can be updated
        if (goal.getIsLocked()) {
            throw new RuntimeException("Goal is locked and cannot be modified. Create a new version instead.");
        }

        // Check if goal is used in completed cycles
        if (isGoalUsedInCompletedCycle(goalId)) {
            // Create new version instead of updating
            return createNewVersion(goalId, request);
        }

        // Store old values for audit
        Map<String, Object> oldValues = Map.of(
            "title", goal.getTitle(),
            "description", goal.getDescription() != null ? goal.getDescription() : "",
            "weightage", goal.getWeightage(),
            "successCriteria", goal.getSuccessCriteria() != null ? goal.getSuccessCriteria() : ""
        );

        // Update goal
        if (request.getTitle() != null) goal.setTitle(request.getTitle());
        if (request.getDescription() != null) goal.setDescription(request.getDescription());
        if (request.getWeightage() != null) goal.setWeightage(request.getWeightage());
        if (request.getSuccessCriteria() != null) goal.setSuccessCriteria(request.getSuccessCriteria());
        if (request.getTargetDate() != null) goal.setTargetDate(request.getTargetDate());
        goal.setUpdatedBy(request.getUpdatedBy());

        Goal saved = goalRepository.save(goal);

        // Create version snapshot
        createVersion(saved, request.getChangeReason() != null ? request.getChangeReason() : "Goal updated", 
                     request.getUpdatedBy());

        // Audit with field changes
        Map<String, Object> newValues = Map.of(
            "title", saved.getTitle(),
            "description", saved.getDescription() != null ? saved.getDescription() : "",
            "weightage", saved.getWeightage(),
            "successCriteria", saved.getSuccessCriteria() != null ? saved.getSuccessCriteria() : ""
        );

        Map<String, AuditService.FieldChange> fieldChanges = new HashMap<>();
        fieldChanges.put("title", new AuditService.FieldChange(oldValues.get("title"), newValues.get("title")));
        fieldChanges.put("description", new AuditService.FieldChange(oldValues.get("description"), newValues.get("description")));
        fieldChanges.put("weightage", new AuditService.FieldChange(oldValues.get("weightage"), newValues.get("weightage")));
        fieldChanges.put("successCriteria", new AuditService.FieldChange(oldValues.get("successCriteria"), newValues.get("successCriteria")));

        auditService.logFieldChanges(
            WorkflowContext.APPRAISAL,
            saved.getEmployeeId(),
            "Goal",
            saved.getId(),
            request.getUpdatedBy(),
            fieldChanges,
            request.getChangeReason()
        );

        return saved;
    }

    /**
     * Create new version of goal (when original is locked or used in completed cycle)
     */
    @Transactional
    public Goal createNewVersion(String goalId, UpdateGoalRequest request) {
        Goal original = goalRepository.findById(goalId)
            .orElseThrow(() -> new RuntimeException("Goal not found"));

        // Create new goal as new version
        Goal newVersion = new Goal();
        newVersion.setEmployeeId(original.getEmployeeId());
        newVersion.setTitle(request.getTitle() != null ? request.getTitle() : original.getTitle());
        newVersion.setDescription(request.getDescription() != null ? request.getDescription() : original.getDescription());
        newVersion.setWeightage(request.getWeightage() != null ? request.getWeightage() : original.getWeightage());
        newVersion.setGoalType(original.getGoalType());
        newVersion.setSuccessCriteria(request.getSuccessCriteria() != null ? request.getSuccessCriteria() : original.getSuccessCriteria());
        newVersion.setTargetDate(request.getTargetDate() != null ? request.getTargetDate() : original.getTargetDate());
        newVersion.setStatus(GoalStatus.ACTIVE);
        newVersion.setVersionNumber(original.getVersionNumber() + 1);
        newVersion.setPreviousVersionId(original.getId());
        newVersion.setIsCurrentVersion(true);
        newVersion.setIsLocked(false);
        newVersion.setCreatedInContext(original.getCreatedInContext());
        newVersion.setCreatedBy(request.getUpdatedBy());

        // Mark old version as not current
        original.setIsCurrentVersion(false);
        goalRepository.save(original);

        Goal saved = goalRepository.save(newVersion);

        // Create version record
        createVersion(saved, request.getChangeReason() != null ? request.getChangeReason() : "New version created", 
                     request.getUpdatedBy());

        // Audit
        auditService.logAction(
            WorkflowContext.APPRAISAL,
            saved.getEmployeeId(),
            "GOAL_VERSION_CREATED",
            "Goal",
            saved.getId(),
            request.getUpdatedBy(),
            Map.of("previousVersionId", original.getId(), "newVersionNumber", saved.getVersionNumber())
        );

        return saved;
    }

    /**
     * Lock goal (when cycle starts or PIP begins)
     */
    @Transactional
    public Goal lockGoal(String goalId, String lockedBy, String lockReason) {
        Goal goal = goalRepository.findById(goalId)
            .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (goal.getIsLocked()) {
            throw new RuntimeException("Goal is already locked");
        }

        goal.setIsLocked(true);
        goal.setLockedAt(LocalDateTime.now());
        goal.setLockedBy(lockedBy);
        goal.setLockReason(lockReason);

        Goal saved = goalRepository.save(goal);

        // Audit
        auditService.logAction(
            WorkflowContext.APPRAISAL,
            saved.getEmployeeId(),
            "GOAL_LOCKED",
            "Goal",
            saved.getId(),
            lockedBy,
            Map.of("lockReason", lockReason)
        );

        return saved;
    }

    /**
     * Get all goals for a user
     */
    public List<Goal> getUserGoals(String employeeId, Boolean includeArchived) {
        if (includeArchived != null && includeArchived) {
            return goalRepository.findByEmployeeId(employeeId);
        }
        return goalRepository.findByEmployeeIdAndIsCurrentVersion(employeeId, true);
    }

    /**
     * Get goal with version history
     */
    public GoalWithHistory getGoalWithHistory(String goalId) {
        Goal goal = goalRepository.findById(goalId)
            .orElseThrow(() -> new RuntimeException("Goal not found"));

        List<GoalVersion> versions = versionRepository.findByGoalIdOrderByVersionNumberDesc(goalId);
        List<GoalContextLink> contextLinks = contextLinkRepository.findByGoalId(goalId);

        return new GoalWithHistory(goal, versions, contextLinks);
    }

    /**
     * Link goals to PIP
     */
    @Transactional
    public void linkGoalsToPIP(String pipId, List<String> goalIds, String linkedBy) {
        for (String goalId : goalIds) {
            Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found: " + goalId));

            PIPGoalLink link = new PIPGoalLink();
            link.setPipId(pipId);
            link.setGoalId(goalId);
            link.setGoalVersionNumber(goal.getVersionNumber());
            link.setWeightageInPip(goal.getWeightage());
            link.setIsActive(true);
            link.setCreatedBy(linkedBy);

            pipGoalLinkRepository.save(link);

            // Create context link
            GoalContextLink contextLink = new GoalContextLink();
            contextLink.setGoal(goal);
            contextLink.setContext(WorkflowContext.PIP);
            contextLink.setContextId(pipId);
            contextLink.setGoalVersionNumber(goal.getVersionNumber());
            contextLink.setIsSnapshot(false);
            contextLink.setCreatedBy(linkedBy);
            contextLinkRepository.save(contextLink);
        }
    }

    /**
     * Create snapshot of goals for Appraisal cycle
     */
    @Transactional
    public void createAppraisalSnapshot(String cycleId, String participantId, List<String> goalIds, String snapshotBy) {
        for (String goalId : goalIds) {
            Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found: " + goalId));

            AppraisalGoalSnapshot snapshot = new AppraisalGoalSnapshot();
            snapshot.setAppraisalCycleId(cycleId);
            snapshot.setParticipantId(participantId);
            snapshot.setGoalId(goalId);
            snapshot.setGoalVersionNumber(goal.getVersionNumber());
            snapshot.setTitle(goal.getTitle());
            snapshot.setDescription(goal.getDescription());
            snapshot.setWeightage(goal.getWeightage());
            snapshot.setSuccessCriteria(goal.getSuccessCriteria());
            snapshot.setTargetDate(goal.getTargetDate());
            snapshot.setSnapshotTakenBy(snapshotBy);
            snapshot.setCreatedBy(snapshotBy);

            snapshotRepository.save(snapshot);

            // Create context link
            GoalContextLink contextLink = new GoalContextLink();
            contextLink.setGoal(goal);
            contextLink.setContext(WorkflowContext.APPRAISAL);
            contextLink.setContextId(participantId);
            contextLink.setGoalVersionNumber(goal.getVersionNumber());
            contextLink.setIsSnapshot(true);
            contextLink.setSnapshotTakenAt(LocalDateTime.now());
            contextLink.setCreatedBy(snapshotBy);
            contextLinkRepository.save(contextLink);
        }
    }

    private void createVersion(Goal goal, String reason, String changedBy) {
        GoalVersion version = new GoalVersion();
        version.setGoal(goal);
        version.setVersionNumber(goal.getVersionNumber());
        version.setTitle(goal.getTitle());
        version.setDescription(goal.getDescription());
        version.setWeightage(goal.getWeightage());
        version.setSuccessCriteria(goal.getSuccessCriteria());
        version.setTargetDate(goal.getTargetDate());
        version.setChangeReason(reason);
        version.setChangedBy(changedBy);
        versionRepository.save(version);
    }

    private boolean isGoalUsedInCompletedCycle(String goalId) {
        // Check if goal is linked to completed PIP or Appraisal
        // Implementation would check if linked contexts are completed
        // For now, check if goal is locked (indicates it's in use)
        Goal goal = goalRepository.findById(goalId).orElse(null);
        return goal != null && goal.getIsLocked();
    }

    // DTOs
    public static class CreateGoalRequest {
        private String employeeId;
        private String title;
        private String description;
        private Double weightage;
        private GoalType goalType;
        private String successCriteria;
        private java.time.LocalDate targetDate;
        private String createdInContext;
        private String createdInContextId;
        private String createdBy;

        // Getters and setters
        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Double getWeightage() { return weightage; }
        public void setWeightage(Double weightage) { this.weightage = weightage; }
        public GoalType getGoalType() { return goalType; }
        public void setGoalType(GoalType goalType) { this.goalType = goalType; }
        public String getSuccessCriteria() { return successCriteria; }
        public void setSuccessCriteria(String successCriteria) { this.successCriteria = successCriteria; }
        public java.time.LocalDate getTargetDate() { return targetDate; }
        public void setTargetDate(java.time.LocalDate targetDate) { this.targetDate = targetDate; }
        public String getCreatedInContext() { return createdInContext; }
        public void setCreatedInContext(String createdInContext) { this.createdInContext = createdInContext; }
        public String getCreatedInContextId() { return createdInContextId; }
        public void setCreatedInContextId(String createdInContextId) { this.createdInContextId = createdInContextId; }
        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    }

    public static class UpdateGoalRequest {
        private String title;
        private String description;
        private Double weightage;
        private String successCriteria;
        private java.time.LocalDate targetDate;
        private String changeReason;
        private String updatedBy;

        // Getters and setters
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Double getWeightage() { return weightage; }
        public void setWeightage(Double weightage) { this.weightage = weightage; }
        public String getSuccessCriteria() { return successCriteria; }
        public void setSuccessCriteria(String successCriteria) { this.successCriteria = successCriteria; }
        public java.time.LocalDate getTargetDate() { return targetDate; }
        public void setTargetDate(java.time.LocalDate targetDate) { this.targetDate = targetDate; }
        public String getChangeReason() { return changeReason; }
        public void setChangeReason(String changeReason) { this.changeReason = changeReason; }
        public String getUpdatedBy() { return updatedBy; }
        public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    }

    public static class GoalWithHistory {
        private Goal goal;
        private List<GoalVersion> versions;
        private List<GoalContextLink> contextLinks;

        public GoalWithHistory(Goal goal, List<GoalVersion> versions, List<GoalContextLink> contextLinks) {
            this.goal = goal;
            this.versions = versions;
            this.contextLinks = contextLinks;
        }

        // Getters
        public Goal getGoal() { return goal; }
        public List<GoalVersion> getVersions() { return versions; }
        public List<GoalContextLink> getContextLinks() { return contextLinks; }
    }
}

