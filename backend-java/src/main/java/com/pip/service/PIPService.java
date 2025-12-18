package com.pip.service;

import com.pip.model.*;
import com.pip.repository.PIPRepository;
import com.pip.repository.GoalRepository;
import com.pip.repository.CheckInRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PIPService {
    @Autowired
    private PIPRepository pipRepository;

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private CheckInRepository checkInRepository;

    @Autowired
    private DeadlinePolicyService deadlinePolicyService;

    @Autowired
    private DeadlineCalculationService deadlineCalculationService;

    @Autowired
    private BusinessDayService businessDayService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Transactional
    public PIP createPIP(CreatePIPRequest request) {
        // Validate goals weightage
        double totalWeightage = request.getGoals().stream()
                .mapToDouble(Goal::getWeightage)
                .sum();
        if (totalWeightage > 100) {
            throw new RuntimeException("Total weightage cannot exceed 100%");
        }

        // Get deadline policy
        DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();

        // Validate timeline durations against policy
        PIPTimeline requestTimeline = request.getTimeline();
        if (requestTimeline.getPipActiveDuration() != null) {
            if (!deadlinePolicyService.validateDeadlineValue("active_duration", 
                    requestTimeline.getPipActiveDuration(), policy)) {
                throw new RuntimeException("Active duration must be between " + 
                    policy.getActiveDurationMinDays() + " and " + 
                    policy.getActiveDurationMaxDays() + " days");
            }
        }

        PIP pip = new PIP();
        pip.setEmployeeId(request.getEmployeeId());
        pip.setManagerId(request.getManagerId());
        pip.setHrbpId(request.getHrbpId());
        pip.setReason(request.getReason());
        pip.setSupportingDocuments(request.getSupportingDocuments());
        pip.setStatus(PIPStatus.PENDING_HRBP_REVIEW);
        pip.setLocked(false);
        pip.setVersion(1);

        // Set timeline with durations (not absolute dates)
        PIPTimeline timeline = new PIPTimeline();
        
        // Use provided durations or defaults from policy
        timeline.setEmployeeAcknowledgementDuration(
            requestTimeline.getEmployeeAcknowledgementDuration() != null ?
            requestTimeline.getEmployeeAcknowledgementDuration() :
            policy.getEmployeeAckDefaultDays()
        );
        
        timeline.setPipActiveDuration(
            requestTimeline.getPipActiveDuration() != null ?
            requestTimeline.getPipActiveDuration() :
            policy.getActiveDurationDefaultDays()
        );
        
        timeline.setSelfReviewBufferDuration(
            requestTimeline.getSelfReviewBufferDuration() != null ?
            requestTimeline.getSelfReviewBufferDuration() :
            policy.getSelfReviewBufferDefaultDays()
        );
        
        timeline.setManagerReviewBufferDuration(
            requestTimeline.getManagerReviewBufferDuration() != null ?
            requestTimeline.getManagerReviewBufferDuration() :
            policy.getManagerReviewBufferDefaultDays()
        );
        
        timeline.setHrbpDecisionBufferDuration(
            requestTimeline.getHrbpDecisionBufferDuration() != null ?
            requestTimeline.getHrbpDecisionBufferDuration() :
            policy.getHrbpDecisionBufferDefaultDays()
        );
        
        timeline.setGracePeriod(policy.getGracePeriodDays());
        
        // Store original duration for extension tracking
        pip.setOriginalActiveDuration(timeline.getPipActiveDuration());
        
        pip.setTimeline(timeline);

        // Create goals
        List<Goal> goals = request.getGoals().stream().map(goalRequest -> {
            Goal goal = new Goal();
            goal.setTitle(goalRequest.getTitle());
            goal.setDescription(goalRequest.getDescription());
            goal.setWeightage(goalRequest.getWeightage());
            goal.setExpectedOutcome(goalRequest.getExpectedOutcome());
            goal.setTargetTimeline(goalRequest.getTargetTimeline());
            goal.setDeadline(goalRequest.getDeadline());
            goal.setPip(pip);
            return goal;
        }).collect(Collectors.toList());
        pip.setGoals(goals);

        pip.setCheckIns(new ArrayList<>());
        
        // Save pip first to get ID and timestamp
        PIP savedPip = pipRepository.save(pip);
        
        // Initialize steps with calculated deadlines
        List<PIPStep> steps = initializeSteps(savedPip, policy);
        for (PIPStep step : steps) {
            step.setPip(savedPip);
        }
        savedPip.setSteps(steps);
        
        // Save again with steps
        return pipRepository.save(savedPip);
    }

    private List<PIPStep> initializeSteps(PIP pip, DeadlinePolicy policy) {
        List<PIPStep> steps = new ArrayList<>();
        LocalDateTime createdAt = pip.getCreatedAt() != null ? pip.getCreatedAt() : LocalDateTime.now();

        // Step 0: HRBP Initial Review
        PIPStep hrbpReviewStep = new PIPStep();
        hrbpReviewStep.setStep(StepName.HRBP_REVIEW);
        hrbpReviewStep.setStatus(StepStatus.PENDING);
        LocalDateTime hrbpDeadline = deadlineCalculationService.calculateHrbpReviewDeadline(createdAt, policy);
        hrbpReviewStep.setDueDate(hrbpDeadline.format(DATE_FORMATTER));
        hrbpReviewStep.setPipId(pip.getId());
        steps.add(hrbpReviewStep);

        // Step 1: Employee Acknowledgement (deadline will be recalculated when HRBP approves)
        PIPStep ackStep = new PIPStep();
        ackStep.setStep(StepName.EMPLOYEE_ACKNOWLEDGEMENT);
        ackStep.setStatus(StepStatus.PENDING);
        // Temporary deadline - will be recalculated after HRBP approval
        ackStep.setDueDate(createdAt.plusDays(policy.getEmployeeAckDefaultDays()).format(DATE_FORMATTER));
        ackStep.setPipId(pip.getId());
        steps.add(ackStep);

        // Step 2: Active PIP (deadline will be calculated when employee acknowledges)
        PIPStep activeStep = new PIPStep();
        activeStep.setStep(StepName.ACTIVE_PIP);
        activeStep.setStatus(StepStatus.PENDING);
        // Temporary - will be recalculated based on actual acknowledgement
        activeStep.setDueDate(createdAt.plusDays(policy.getActiveDurationDefaultDays()).format(DATE_FORMATTER));
        activeStep.setPipId(pip.getId());
        steps.add(activeStep);

        // Step 3: Employee Self-Review (deadline will be calculated when active period ends)
        PIPStep selfReviewStep = new PIPStep();
        selfReviewStep.setStep(StepName.EMPLOYEE_SELF_REVIEW);
        selfReviewStep.setStatus(StepStatus.PENDING);
        // Temporary - will be recalculated
        selfReviewStep.setDueDate(createdAt.plusDays(policy.getActiveDurationDefaultDays() + 
            policy.getSelfReviewBufferDefaultDays()).format(DATE_FORMATTER));
        selfReviewStep.setPipId(pip.getId());
        steps.add(selfReviewStep);

        // Step 4: Manager Review (deadline will be calculated when self-review submitted)
        PIPStep managerReviewStep = new PIPStep();
        managerReviewStep.setStep(StepName.MANAGER_REVIEW);
        managerReviewStep.setStatus(StepStatus.PENDING);
        // Temporary - will be recalculated
        managerReviewStep.setDueDate(createdAt.plusDays(policy.getActiveDurationDefaultDays() + 
            policy.getSelfReviewBufferDefaultDays() + 
            policy.getManagerReviewBufferDefaultDays()).format(DATE_FORMATTER));
        managerReviewStep.setPipId(pip.getId());
        steps.add(managerReviewStep);

        // Step 5: HRBP Decision (deadline will be calculated when manager review completed)
        PIPStep hrbpDecisionStep = new PIPStep();
        hrbpDecisionStep.setStep(StepName.HRBP_DECISION);
        hrbpDecisionStep.setStatus(StepStatus.PENDING);
        // Temporary - will be recalculated
        hrbpDecisionStep.setDueDate(createdAt.plusDays(policy.getActiveDurationDefaultDays() + 
            policy.getSelfReviewBufferDefaultDays() + 
            policy.getManagerReviewBufferDefaultDays() + 
            policy.getHrbpDecisionBufferDefaultDays()).format(DATE_FORMATTER));
        hrbpDecisionStep.setPipId(pip.getId());
        steps.add(hrbpDecisionStep);

        return steps;
    }

    /**
     * Approve PIP by HRBP - recalculates all downstream deadlines
     */
    @Transactional
    public PIP approvePIPByHrbp(String pipId, String hrbpId) {
        PIP pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        if (!pip.getHrbpId().equals(hrbpId)) {
            throw new RuntimeException("Unauthorized: Only assigned HRBP can approve");
        }

        if (pip.getStatus() != PIPStatus.PENDING_HRBP_REVIEW) {
            throw new RuntimeException("PIP is not in PENDING_HRBP_REVIEW status");
        }

        // Mark HRBP review step as completed
        PIPStep hrbpReviewStep = pip.getSteps().stream()
                .filter(s -> s.getStep() == StepName.HRBP_REVIEW)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("HRBP review step not found"));

        LocalDateTime now = LocalDateTime.now();
        hrbpReviewStep.setStatus(StepStatus.COMPLETED);
        hrbpReviewStep.setCompletedDate(now.format(DATE_FORMATTER));
        hrbpReviewStep.setSignedBy(hrbpId);

        // Update PIP
        pip.setHrbpApprovedAt(now);
        pip.setStatus(PIPStatus.PENDING_EMPLOYEE_ACKNOWLEDGEMENT);

        // Recalculate all downstream deadlines
        DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();
        deadlineCalculationService.recalculateDeadlines(pip, policy);

        pip.setVersion(pip.getVersion() + 1);
        return pipRepository.save(pip);
    }

    /**
     * Acknowledge PIP by employee - starts active period
     */
    @Transactional
    public PIP acknowledgePIP(String pipId, String employeeId, String comments) {
        PIP pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        if (!pip.getEmployeeId().equals(employeeId)) {
            throw new RuntimeException("Unauthorized: Only assigned employee can acknowledge");
        }

        if (pip.getStatus() != PIPStatus.PENDING_EMPLOYEE_ACKNOWLEDGEMENT && 
            pip.getStatus() != PIPStatus.OVERDUE_EMPLOYEE_ACKNOWLEDGEMENT) {
            throw new RuntimeException("PIP is not awaiting acknowledgement");
        }

        // Mark acknowledgement step as completed
        PIPStep ackStep = pip.getSteps().stream()
                .filter(s -> s.getStep() == StepName.EMPLOYEE_ACKNOWLEDGEMENT)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Acknowledgement step not found"));

        LocalDateTime now = LocalDateTime.now();
        ackStep.setStatus(StepStatus.COMPLETED);
        ackStep.setCompletedDate(now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        ackStep.setSignedBy(employeeId);
        if (comments != null) {
            ackStep.setComments(comments);
        }

        // Update PIP - active period starts NOW (not from original deadline)
        pip.setEmployeeAcknowledgedAt(now);
        pip.setActivePeriodStartedAt(now);
        pip.setStatus(PIPStatus.ACTIVE);

        // Recalculate active period end and downstream deadlines
        DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();
        deadlineCalculationService.recalculateDeadlines(pip, policy);

        pip.setVersion(pip.getVersion() + 1);
        return pipRepository.save(pip);
    }

    /**
     * Validate check-in requirements before completing active period
     */
    public boolean validateCheckInRequirements(PIP pip, DeadlinePolicy policy) {
        int minCheckIns = policy.getMinCheckInsRequired();
        int actualCheckIns = pip.getCheckIns() != null ? pip.getCheckIns().size() : 0;
        return actualCheckIns >= minCheckIns;
    }

    /**
     * Complete active period - validates check-ins first
     */
    @Transactional
    public PIP completeActivePeriod(String pipId, String userId, boolean forceComplete) {
        PIP pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        if (pip.getStatus() != PIPStatus.ACTIVE) {
            throw new RuntimeException("PIP is not in ACTIVE status");
        }

        PIPStep activeStep = pip.getSteps().stream()
                .filter(s -> s.getStep() == StepName.ACTIVE_PIP)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Active PIP step not found"));

        DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();
        
        // Validate check-ins unless forced
        if (!forceComplete && !validateCheckInRequirements(pip, policy)) {
            pip.setStatus(PIPStatus.ACTIVE_PENDING_VALIDATION);
            return pipRepository.save(pip);
        }

        LocalDateTime now = LocalDateTime.now();
        activeStep.setStatus(StepStatus.COMPLETED);
        activeStep.setCompletedDate(now.format(DATE_FORMATTER));
        activeStep.setSignedBy(userId);

        pip.setActivePeriodEndedAt(now);
        pip.setStatus(PIPStatus.PENDING_EMPLOYEE_SELF_REVIEW);

        // Recalculate downstream deadlines
        deadlineCalculationService.recalculateDeadlines(pip, policy);

        pip.setVersion(pip.getVersion() + 1);
        return pipRepository.save(pip);
    }

    public List<PIP> getAllPIPs(String userId, String userRole) {
        List<PIP> allPIPs = pipRepository.findAll();

        if ("admin".equals(userRole) || "executive".equals(userRole)) {
            return allPIPs;
        } else if ("manager".equals(userRole)) {
            return allPIPs.stream()
                    .filter(p -> p.getManagerId().equals(userId))
                    .collect(Collectors.toList());
        } else if ("employee".equals(userRole)) {
            return allPIPs.stream()
                    .filter(p -> p.getEmployeeId().equals(userId))
                    .collect(Collectors.toList());
        } else if ("hrbp".equals(userRole)) {
            return allPIPs.stream()
                    .filter(p -> p.getHrbpId().equals(userId))
                    .collect(Collectors.toList());
        }

        return Collections.emptyList();
    }

    public Optional<PIP> getPIPById(String id) {
        return pipRepository.findById(id);
    }

    @Transactional
    public PIP updatePIPStatus(String pipId, PIPStatus status, String userId) {
        PIP pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        if (pip.getLocked()) {
            throw new RuntimeException("PIP is locked");
        }

        pip.setStatus(status);
        pip.setVersion(pip.getVersion() + 1);
        return pipRepository.save(pip);
    }

    @Transactional
    public PIP updateGoals(String pipId, List<Goal> goals, String userId) {
        PIP pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        // Update existing goals in place to avoid JPA cascade delete orphan issue
        // Create a map of goal IDs to updated goals for quick lookup
        java.util.Map<String, Goal> updatedGoalsMap = goals.stream()
                .collect(Collectors.toMap(Goal::getId, g -> g));
        
        // Update existing goals in the collection
        if (pip.getGoals() != null) {
            for (Goal existingGoal : pip.getGoals()) {
                Goal updatedGoal = updatedGoalsMap.get(existingGoal.getId());
                if (updatedGoal != null) {
                    // Update fields from the updated goal
                    if (updatedGoal.getJustification() != null) {
                        existingGoal.setJustification(updatedGoal.getJustification());
                    }
                    if (updatedGoal.getEmployeeAttachments() != null) {
                        existingGoal.setEmployeeAttachments(updatedGoal.getEmployeeAttachments());
                    }
                    if (updatedGoal.getStatus() != null) {
                        existingGoal.setStatus(updatedGoal.getStatus());
                    }
                    if (updatedGoal.getManagerComments() != null) {
                        existingGoal.setManagerComments(updatedGoal.getManagerComments());
                    }
                }
            }
        }
        
        pip.setVersion(pip.getVersion() + 1);
        return pipRepository.save(pip);
    }

    @Transactional
    public PIP updateStep(String pipId, String stepName, StepUpdateRequest update) {
        PIP pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        // Normalize step name by removing underscores and converting to uppercase
        String normalizedStepName = stepName.replace("_", "").replace("-", "").toUpperCase();
        PIPStep step = pip.getSteps().stream()
                .filter(s -> s.getStep().name().replace("_", "").equalsIgnoreCase(normalizedStepName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Step not found: " + stepName + " (normalized: " + normalizedStepName + ")"));

        if (update.getStatus() != null) {
            step.setStatus(update.getStatus());
        }
        if (update.getComments() != null) {
            step.setComments(update.getComments());
        }
        if (update.getSignedBy() != null) {
            step.setSignedBy(update.getSignedBy());
            step.setCompletedDate(LocalDateTime.now().format(DATE_FORMATTER));
            
            // Update PIP timestamps based on step completion
            updatePIPTimestamps(pip, step);
        }

        // Recalculate deadlines after step update
        DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();
        deadlineCalculationService.recalculateDeadlines(pip, policy);

        pip.setVersion(pip.getVersion() + 1);
        return pipRepository.save(pip);
    }

    private void updatePIPTimestamps(PIP pip, PIPStep step) {
        if (step.getCompletedDate() == null) {
            return;
        }
        
        // Handle both DATE (YYYY-MM-DD) and DATETIME (YYYY-MM-DDTHH:mm:ss) formats
        LocalDateTime completedAt;
        String completedDateStr = step.getCompletedDate();
        if (completedDateStr.length() == 10) {
            // DATE format: YYYY-MM-DD
            completedAt = LocalDate.parse(completedDateStr).atStartOfDay();
        } else {
            // DATETIME format: YYYY-MM-DDTHH:mm:ss
            completedAt = LocalDateTime.parse(completedDateStr, DATE_FORMATTER);
        }
        
        switch (step.getStep()) {
            case HRBP_REVIEW:
                pip.setHrbpApprovedAt(completedAt);
                break;
            case EMPLOYEE_ACKNOWLEDGEMENT:
                pip.setEmployeeAcknowledgedAt(completedAt);
                pip.setActivePeriodStartedAt(completedAt);
                break;
            case ACTIVE_PIP:
                pip.setActivePeriodEndedAt(completedAt);
                break;
            case EMPLOYEE_SELF_REVIEW:
                pip.setSelfReviewSubmittedAt(completedAt);
                break;
            case MANAGER_REVIEW:
                pip.setManagerReviewCompletedAt(completedAt);
                break;
            case HRBP_DECISION:
                // Final decision - no timestamp update needed
                break;
        }
    }

    @Transactional
    public CheckIn addCheckIn(String pipId, CheckInRequest request) {
        PIP pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        CheckIn checkIn = new CheckIn();
        checkIn.setPipId(pipId);
        checkIn.setDate(request.getDate());
        checkIn.setNotes(request.getNotes());
        checkIn.setAttachments(request.getAttachments());
        checkIn.setCreatedAt(LocalDateTime.now());

        CheckIn saved = checkInRepository.save(checkIn);
        pip.getCheckIns().add(saved);
        pipRepository.save(pip);

        return saved;
    }

    // DTOs
    public static class CreatePIPRequest {
        private String employeeId;
        private String managerId;
        private String hrbpId;
        private String reason;
        private String supportingDocuments;
        private List<Goal> goals;
        private PIPTimeline timeline;

        // Getters and setters
        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
        public String getManagerId() { return managerId; }
        public void setManagerId(String managerId) { this.managerId = managerId; }
        public String getHrbpId() { return hrbpId; }
        public void setHrbpId(String hrbpId) { this.hrbpId = hrbpId; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getSupportingDocuments() { return supportingDocuments; }
        public void setSupportingDocuments(String supportingDocuments) { this.supportingDocuments = supportingDocuments; }
        public List<Goal> getGoals() { return goals; }
        public void setGoals(List<Goal> goals) { this.goals = goals; }
        public PIPTimeline getTimeline() { return timeline; }
        public void setTimeline(PIPTimeline timeline) { this.timeline = timeline; }
    }

    public static class StepUpdateRequest {
        private StepStatus status;
        private String comments;
        private String signedBy;

        public StepStatus getStatus() { return status; }
        public void setStatus(StepStatus status) { this.status = status; }
        public String getComments() { return comments; }
        public void setComments(String comments) { this.comments = comments; }
        public String getSignedBy() { return signedBy; }
        public void setSignedBy(String signedBy) { this.signedBy = signedBy; }
    }

    public static class CheckInRequest {
        private String date;
        private String notes;
        private String attachments;

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public String getAttachments() { return attachments; }
        public void setAttachments(String attachments) { this.attachments = attachments; }
    }
}
