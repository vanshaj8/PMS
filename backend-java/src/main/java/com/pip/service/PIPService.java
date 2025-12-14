package com.pip.service;

import com.pip.model.*;
import com.pip.repository.PIPRepository;
import com.pip.repository.GoalRepository;
import com.pip.repository.CheckInRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        PIP pip = new PIP();
        pip.setEmployeeId(request.getEmployeeId());
        pip.setManagerId(request.getManagerId());
        pip.setHrbpId(request.getHrbpId());
        pip.setReason(request.getReason());
        pip.setSupportingDocuments(request.getSupportingDocuments());
        pip.setStatus(PIPStatus.PENDING_HRBP_REVIEW);
        pip.setLocked(false);
        pip.setVersion(1);

        // Set timeline
        PIPTimeline timeline = new PIPTimeline();
        timeline.setEmployeeAcknowledgementDeadline(request.getTimeline().getEmployeeAcknowledgementDeadline());
        timeline.setPipActiveDuration(request.getTimeline().getPipActiveDuration());
        timeline.setEmployeeSelfReviewDeadline(request.getTimeline().getEmployeeSelfReviewDeadline());
        timeline.setManagerFinalReviewDeadline(request.getTimeline().getManagerFinalReviewDeadline());
        timeline.setHrbpFinalDecisionDeadline(request.getTimeline().getHrbpFinalDecisionDeadline());
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
        
        // Save pip first to get ID
        PIP savedPip = pipRepository.save(pip);
        
        // Initialize steps with pip ID
        List<PIPStep> steps = initializeSteps(timeline, savedPip);
        for (PIPStep step : steps) {
            step.setPip(savedPip);
        }
        savedPip.setSteps(steps);
        
        // Save again with steps
        return pipRepository.save(savedPip);
    }

    private List<PIPStep> initializeSteps(PIPTimeline timeline, PIP pip) {
        List<PIPStep> steps = new ArrayList<>();
        String now = LocalDateTime.now().format(DATE_FORMATTER);

        PIPStep step1 = new PIPStep();
        step1.setStep(StepName.EMPLOYEE_ACKNOWLEDGEMENT);
        step1.setStatus(StepStatus.PENDING);
        step1.setDueDate(timeline.getEmployeeAcknowledgementDeadline());
        step1.setPipId(pip.getId());
        steps.add(step1);

        PIPStep step2 = new PIPStep();
        step2.setStep(StepName.ACTIVE_PIP);
        step2.setStatus(StepStatus.PENDING);
        // Calculate active end date
        LocalDateTime ackDate = LocalDateTime.parse(timeline.getEmployeeAcknowledgementDeadline(), DATE_FORMATTER);
        LocalDateTime activeEndDate = ackDate.plusDays(timeline.getPipActiveDuration());
        step2.setDueDate(activeEndDate.format(DATE_FORMATTER));
        step2.setPipId(pip.getId());
        steps.add(step2);

        PIPStep step3 = new PIPStep();
        step3.setStep(StepName.EMPLOYEE_SELF_REVIEW);
        step3.setStatus(StepStatus.PENDING);
        step3.setDueDate(timeline.getEmployeeSelfReviewDeadline());
        step3.setPipId(pip.getId());
        steps.add(step3);

        PIPStep step4 = new PIPStep();
        step4.setStep(StepName.MANAGER_REVIEW);
        step4.setStatus(StepStatus.PENDING);
        step4.setDueDate(timeline.getManagerFinalReviewDeadline());
        step4.setPipId(pip.getId());
        steps.add(step4);

        PIPStep step5 = new PIPStep();
        step5.setStep(StepName.HRBP_DECISION);
        step5.setStatus(StepStatus.PENDING);
        step5.setDueDate(timeline.getHrbpFinalDecisionDeadline());
        step5.setPipId(pip.getId());
        steps.add(step5);

        return steps;
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

        for (Goal goal : goals) {
            goal.setPip(pip);
        }
        pip.setGoals(goals);
        pip.setVersion(pip.getVersion() + 1);
        return pipRepository.save(pip);
    }

    @Transactional
    public PIP updateStep(String pipId, String stepName, StepUpdateRequest update) {
        PIP pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        PIPStep step = pip.getSteps().stream()
                .filter(s -> s.getStep().name().equalsIgnoreCase(stepName.replace("_", "")))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Step not found"));

        if (update.getStatus() != null) {
            step.setStatus(update.getStatus());
        }
        if (update.getComments() != null) {
            step.setComments(update.getComments());
        }
        if (update.getSignedBy() != null) {
            step.setSignedBy(update.getSignedBy());
            step.setCompletedDate(LocalDateTime.now().format(DATE_FORMATTER));
        }

        pip.setVersion(pip.getVersion() + 1);
        return pipRepository.save(pip);
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
        checkIn.setCreatedAt(LocalDateTime.now().format(DATE_FORMATTER));

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

