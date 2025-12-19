package com.pip.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pip.model.*;
import com.pip.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AppraisalCycleService {
    @Autowired
    private AppraisalCycleRepository cycleRepository;

    @Autowired
    private AppraisalParticipantRepository participantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReviewPhaseRepository phaseRepository;

    @Autowired
    private AppraisalGoalRepository goalRepository;

    @Autowired(required = false)
    private com.pip.goals.service.GoalService goalService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public AppraisalCycle createCycle(CreateAppraisalCycleRequest request) {
        // Validate cycle name uniqueness
        if (cycleRepository.findByCycleNameIgnoreCase(request.getCycleName()).isPresent()) {
            throw new RuntimeException("Cycle name already exists");
        }

        // Validate dates
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Start date must be before end date");
        }

        AppraisalCycle cycle = new AppraisalCycle();
        cycle.setCycleName(request.getCycleName());
        cycle.setStartDate(request.getStartDate());
        cycle.setEndDate(request.getEndDate());
        cycle.setDescription(request.getDescription());
        cycle.setStatus(AppraisalCycleStatus.DRAFT);
        cycle.setCreatedBy(request.getCreatedBy());

        // Store eligibility rules as JSON
        try {
            cycle.setEligibilityRules(objectMapper.writeValueAsString(request.getEligibilityRules()));
        } catch (Exception e) {
            throw new RuntimeException("Invalid eligibility rules format", e);
        }

        // Store review types as JSON
        try {
            cycle.setReviewTypes(objectMapper.writeValueAsString(request.getReviewTypes()));
        } catch (Exception e) {
            throw new RuntimeException("Invalid review types format", e);
        }

        // Store rating scale as JSON
        try {
            cycle.setRatingScale(objectMapper.writeValueAsString(request.getRatingScale()));
        } catch (Exception e) {
            throw new RuntimeException("Invalid rating scale format", e);
        }

        cycle.setForcedDistributionEnabled(request.getForcedDistributionEnabled() != null ? 
            request.getForcedDistributionEnabled() : false);

        if (cycle.getForcedDistributionEnabled()) {
            try {
                cycle.setForcedDistributionRules(objectMapper.writeValueAsString(request.getForcedDistributionRules()));
            } catch (Exception e) {
                throw new RuntimeException("Invalid forced distribution rules format", e);
            }
        }

        AppraisalCycle savedCycle = cycleRepository.save(cycle);

        // Create default phases if provided
        if (request.getPhases() != null && !request.getPhases().isEmpty()) {
            List<ReviewPhase> phases = request.getPhases().stream()
                .map(phaseRequest -> {
                    ReviewPhase phase = new ReviewPhase();
                    phase.setCycle(savedCycle);
                    phase.setPhaseType(phaseRequest.getPhaseType());
                    phase.setPhaseName(phaseRequest.getPhaseName());
                    phase.setStartDate(phaseRequest.getStartDate());
                    phase.setEndDate(phaseRequest.getEndDate());
                    phase.setBufferDays(phaseRequest.getBufferDays() != null ? phaseRequest.getBufferDays() : 0);
                    phase.setAutoLockAfterDeadline(phaseRequest.getAutoLockAfterDeadline() != null ? 
                        phaseRequest.getAutoLockAfterDeadline() : true);
                    phase.setSequenceOrder(phaseRequest.getSequenceOrder());
                    return phase;
                })
                .collect(Collectors.toList());
            phaseRepository.saveAll(phases);
        }

        return savedCycle;
    }

    @Transactional
    public AppraisalCycle activateCycle(String cycleId) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
            .orElseThrow(() -> new RuntimeException("Cycle not found"));

        if (cycle.getStatus() != AppraisalCycleStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT cycles can be activated");
        }

        cycle.setStatus(AppraisalCycleStatus.ACTIVE);
        AppraisalCycle savedCycle = cycleRepository.save(cycle);

        // Auto-enroll eligible participants
        enrollEligibleParticipants(cycleId);

        return savedCycle;
    }

    @Transactional
    public void enrollEligibleParticipants(String cycleId) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
            .orElseThrow(() -> new RuntimeException("Cycle not found"));

        // Get all active users
        List<User> allUsers = userRepository.findByIsActive(true);

        // Parse eligibility rules
        Map<String, Object> eligibilityRules;
        try {
            eligibilityRules = objectMapper.readValue(
                cycle.getEligibilityRules(), 
                new TypeReference<Map<String, Object>>() {}
            );
        } catch (Exception e) {
            throw new RuntimeException("Invalid eligibility rules", e);
        }

        // Filter eligible users
        List<User> eligibleUsers = allUsers.stream()
            .filter(user -> isEligible(user, eligibilityRules, cycle.getStartDate()))
            .collect(Collectors.toList());

        // Create participants for eligible users
        for (User user : eligibleUsers) {
            // Check if participant already exists
            if (participantRepository.findByCycleIdAndEmployeeId(cycleId, user.getId()).isPresent()) {
                continue;
            }

            AppraisalParticipant participant = new AppraisalParticipant();
            participant.setCycle(cycle);
            participant.setEmployeeId(user.getId());
            participant.setManagerId(user.getManagerId() != null ? user.getManagerId() : "");
            participant.setHrbpId(user.getHrbpId());

            // Get skip-level manager
            if (user.getManagerId() != null) {
                Optional<User> manager = userRepository.findById(user.getManagerId());
                if (manager.isPresent() && manager.get().getManagerId() != null) {
                    participant.setSkipLevelManagerId(manager.get().getManagerId());
                }
            }

            participant.setStatus(ParticipantStatus.ELIGIBLE);
            participant.setEligibilityReason("Auto-enrolled based on eligibility rules");

            participantRepository.save(participant);
        }
    }

    private boolean isEligible(User user, Map<String, Object> rules, LocalDate cycleStartDate) {
        // Check department inclusion
        if (rules.containsKey("includedDepartments")) {
            @SuppressWarnings("unchecked")
            List<String> includedDepts = (List<String>) rules.get("includedDepartments");
            if (includedDepts != null && !includedDepts.isEmpty()) {
                if (user.getDepartment() == null || !includedDepts.contains(user.getDepartment())) {
                    return false;
                }
            }
        }

        // Check role inclusion
        if (rules.containsKey("includedRoles")) {
            @SuppressWarnings("unchecked")
            List<String> includedRoles = (List<String>) rules.get("includedRoles");
            if (includedRoles != null && !includedRoles.isEmpty()) {
                if (!includedRoles.contains(user.getRole().name())) {
                    return false;
                }
            }
        }

        // Check exclusions
        if (rules.containsKey("excludedRoles")) {
            @SuppressWarnings("unchecked")
            List<String> excludedRoles = (List<String>) rules.get("excludedRoles");
            if (excludedRoles != null && excludedRoles.contains(user.getRole().name())) {
                return false;
            }
        }

        // Check tenure cutoff
        if (rules.containsKey("tenureCutoffMonths")) {
            Integer tenureMonths = (Integer) rules.get("tenureCutoffMonths");
            if (tenureMonths != null && user.getCreatedAt() != null) {
                long monthsSinceCreation = ChronoUnit.MONTHS.between(
                    user.getCreatedAt().toLocalDate(), 
                    cycleStartDate
                );
                if (monthsSinceCreation < tenureMonths) {
                    return false;
                }
            }
        }

        // Check if user is active
        if (user.getIsActive() == null || !user.getIsActive()) {
            return false;
        }

        return true;
    }

    public List<AppraisalCycle> getAllCycles() {
        return cycleRepository.findAll();
    }

    public List<AppraisalCycle> getActiveCycles() {
        return cycleRepository.findByStatus(AppraisalCycleStatus.ACTIVE);
    }

    public AppraisalCycle getCycleById(String cycleId) {
        return cycleRepository.findById(cycleId)
            .orElseThrow(() -> new RuntimeException("Cycle not found"));
    }

    public List<AppraisalParticipant> getCycleParticipants(String cycleId) {
        return participantRepository.findByCycleId(cycleId);
    }

    @Transactional
    public AppraisalParticipant getParticipant(String cycleId, String employeeId) {
        return participantRepository.findByCycleIdAndEmployeeId(cycleId, employeeId)
            .orElseThrow(() -> new RuntimeException("Participant not found"));
    }

    @Transactional
    public void lockGoals(String cycleId, String participantId) {
        AppraisalParticipant participant = participantRepository.findByCycleIdAndEmployeeId(cycleId, participantId)
            .orElseThrow(() -> new RuntimeException("Participant not found"));

        if (participant.getGoalsLocked()) {
            throw new RuntimeException("Goals already locked");
        }

        // Validate goals weightage
        List<AppraisalGoal> goals = goalRepository.findByParticipantId(participantId);
        double totalWeightage = goals.stream()
            .mapToDouble(AppraisalGoal::getWeightage)
            .sum();
        
        if (Math.abs(totalWeightage - 100.0) > 0.01) {
            throw new RuntimeException("Total goal weightage must equal 100%. Current: " + totalWeightage + "%");
        }

        // If centralized GoalService is available, create snapshots
        if (goalService != null) {
            // Get goal IDs from AppraisalGoal (using id field)
            // Note: In a full migration, AppraisalGoals would reference centralized goals via goalId field
            // For now, we'll use the AppraisalGoal IDs as placeholders
            // In production, you would need to:
            // 1. Check if goals exist in centralized service
            // 2. Create them if they don't exist
            // 3. Create snapshots
            List<String> goalIds = goals.stream()
                .map(AppraisalGoal::getId)
                .filter(id -> id != null && !id.isEmpty())
                .collect(Collectors.toList());
            
            if (!goalIds.isEmpty()) {
                try {
                    // Use employeeId or managerId as the creator
                    String createdBy = participant.getEmployeeId() != null ? participant.getEmployeeId() : "SYSTEM";
                    goalService.createAppraisalSnapshot(
                        cycleId, 
                        participantId, 
                        goalIds, 
                        createdBy
                    );
                } catch (Exception e) {
                    // Log but don't fail - legacy goals will still work
                    System.err.println("Failed to create appraisal snapshot: " + e.getMessage());
                }
            }
        }

        participant.setGoalsLocked(true);
        participant.setGoalsLockedAt(LocalDateTime.now());
        participant.setStatus(ParticipantStatus.GOALS_LOCKED);
        participantRepository.save(participant);
    }

    // DTO classes for requests
    public static class CreateAppraisalCycleRequest {
        private String cycleName;
        private LocalDate startDate;
        private LocalDate endDate;
        private String description;
        private String createdBy;
        private Map<String, Object> eligibilityRules;
        private List<String> reviewTypes;
        private Map<String, Object> ratingScale;
        private Boolean forcedDistributionEnabled;
        private Map<String, Object> forcedDistributionRules;
        private List<CreatePhaseRequest> phases;

        // Getters and setters
        public String getCycleName() { return cycleName; }
        public void setCycleName(String cycleName) { this.cycleName = cycleName; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
        public Map<String, Object> getEligibilityRules() { return eligibilityRules; }
        public void setEligibilityRules(Map<String, Object> eligibilityRules) { this.eligibilityRules = eligibilityRules; }
        public List<String> getReviewTypes() { return reviewTypes; }
        public void setReviewTypes(List<String> reviewTypes) { this.reviewTypes = reviewTypes; }
        public Map<String, Object> getRatingScale() { return ratingScale; }
        public void setRatingScale(Map<String, Object> ratingScale) { this.ratingScale = ratingScale; }
        public Boolean getForcedDistributionEnabled() { return forcedDistributionEnabled; }
        public void setForcedDistributionEnabled(Boolean forcedDistributionEnabled) { this.forcedDistributionEnabled = forcedDistributionEnabled; }
        public Map<String, Object> getForcedDistributionRules() { return forcedDistributionRules; }
        public void setForcedDistributionRules(Map<String, Object> forcedDistributionRules) { this.forcedDistributionRules = forcedDistributionRules; }
        public List<CreatePhaseRequest> getPhases() { return phases; }
        public void setPhases(List<CreatePhaseRequest> phases) { this.phases = phases; }
    }

    public static class CreatePhaseRequest {
        private PhaseType phaseType;
        private String phaseName;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer bufferDays;
        private Boolean autoLockAfterDeadline;
        private Integer sequenceOrder;

        // Getters and setters
        public PhaseType getPhaseType() { return phaseType; }
        public void setPhaseType(PhaseType phaseType) { this.phaseType = phaseType; }
        public String getPhaseName() { return phaseName; }
        public void setPhaseName(String phaseName) { this.phaseName = phaseName; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public Integer getBufferDays() { return bufferDays; }
        public void setBufferDays(Integer bufferDays) { this.bufferDays = bufferDays; }
        public Boolean getAutoLockAfterDeadline() { return autoLockAfterDeadline; }
        public void setAutoLockAfterDeadline(Boolean autoLockAfterDeadline) { this.autoLockAfterDeadline = autoLockAfterDeadline; }
        public Integer getSequenceOrder() { return sequenceOrder; }
        public void setSequenceOrder(Integer sequenceOrder) { this.sequenceOrder = sequenceOrder; }
    }
}

