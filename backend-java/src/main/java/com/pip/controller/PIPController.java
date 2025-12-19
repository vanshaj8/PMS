package com.pip.controller;

import com.pip.model.*;
import com.pip.repository.PIPRepository;
import com.pip.repository.UserRepository;
import com.pip.security.JwtTokenProvider;
import com.pip.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pips")
public class PIPController {
    @Autowired
    private PIPService pipService;

    @Autowired
    private PIPRepository pipRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private EscalationService escalationService;

    @Autowired
    private DeadlinePolicyService deadlinePolicyService;

    @Autowired
    private DeadlineCalculationService deadlineCalculationService;

    @Autowired
    private PIPMetadataService metadataService;

    @Autowired
    private SuccessCriteriaService successCriteriaService;

    @Autowired
    private PIPTrackRecordPDFService pdfService;

    @GetMapping
    public ResponseEntity<?> getAllPIPs(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);
            String role = tokenProvider.getClaimsFromToken(token).get("role", String.class).toLowerCase();

            List<PIP> pips = pipService.getAllPIPs(userId, role);
            return ResponseEntity.ok(Map.of("pips", pips));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPIP(@PathVariable String id, @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);
            String role = tokenProvider.getClaimsFromToken(token).get("role", String.class).toLowerCase();

            PIP pip = pipRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("PIP not found"));

            // Check access
            if (!canAccessPIP(userId, role, pip)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            // Filter out HRBP_REVIEW from active workflow steps (Issue 3 fix)
            // HRBP_REVIEW is the initial approval step, not part of the active workflow lifecycle
            if (pip.getSteps() != null) {
                List<PIPStep> activeWorkflowSteps = pip.getSteps().stream()
                    .filter(s -> s.getStep() != StepName.HRBP_REVIEW)
                    .collect(java.util.stream.Collectors.toList());
                pip.setSteps(activeWorkflowSteps);
            }
            
            // Ensure all metadata is populated if missing
            if (pip.getSuccessCriteriaMetadata() == null && pip.getFinalOutcome() != null) {
                pip.setSuccessCriteriaMetadata(metadataService.createSuccessCriteriaMetadata(pip));
            }
            if (pip.getExtensionPolicyMetadata() == null) {
                pip.setExtensionPolicyMetadata(metadataService.createExtensionPolicyMetadata(pip));
            }
            if (pip.getCheckInValidationMetadata() == null && pip.getCheckIns() != null && !pip.getCheckIns().isEmpty()) {
                pip.setCheckInValidationMetadata(metadataService.createCheckInValidationMetadata(pip));
            }

            return ResponseEntity.ok(Map.of("pip", pip));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> createPIP(@RequestBody Map<String, Object> request, @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String managerId = tokenProvider.getUserIdFromToken(token);

            PIPService.CreatePIPRequest createRequest = new PIPService.CreatePIPRequest();
            createRequest.setEmployeeId((String) request.get("employeeId"));
            createRequest.setManagerId(managerId);
            createRequest.setHrbpId((String) request.get("hrbpId"));
            createRequest.setReason((String) request.get("reason"));
            createRequest.setSupportingDocuments((String) request.get("supportingDocuments"));

            // Parse goals
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> goalsData = (List<Map<String, Object>>) request.get("goals");
            List<Goal> goals = goalsData.stream().map(g -> {
                Goal goal = new Goal();
                goal.setTitle((String) g.get("title"));
                goal.setDescription((String) g.get("description"));
                goal.setWeightage(((Number) g.get("weightage")).doubleValue());
                goal.setExpectedOutcome((String) g.get("expectedOutcome"));
                goal.setTargetTimeline((String) g.get("targetTimeline"));
                goal.setDeadline((String) g.get("deadline"));
                return goal;
            }).collect(Collectors.toList());
            createRequest.setGoals(goals);

            // Parse timeline
            @SuppressWarnings("unchecked")
            Map<String, Object> timelineData = (Map<String, Object>) request.get("timeline");
            PIPTimeline timeline = new PIPTimeline();
            timeline.setEmployeeAcknowledgementDeadline((String) timelineData.get("employeeAcknowledgementDeadline"));
            timeline.setPipActiveDuration(((Number) timelineData.get("pipActiveDuration")).intValue());
            timeline.setEmployeeSelfReviewDeadline((String) timelineData.get("employeeSelfReviewDeadline"));
            timeline.setManagerFinalReviewDeadline((String) timelineData.get("managerFinalReviewDeadline"));
            timeline.setHrbpFinalDecisionDeadline((String) timelineData.get("hrbpFinalDecisionDeadline"));
            createRequest.setTimeline(timeline);

            PIP pip = pipService.createPIP(createRequest);
            return ResponseEntity.status(201).body(Map.of("pip", pip));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/hrbp-approve")
    @PreAuthorize("hasRole('HRBP')")
    public ResponseEntity<?> approvePIPByHrbp(@PathVariable String id, @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            PIP pip = pipService.approvePIPByHrbp(id, userId);
            return ResponseEntity.ok(Map.of("pip", pip));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<?> acknowledgePIP(@PathVariable String id, @RequestBody Map<String, String> request,
                                             @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            PIP pip = pipService.acknowledgePIP(id, userId, request.get("comments"));
            return ResponseEntity.ok(Map.of("pip", pip));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/self-review")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<?> submitSelfReview(@PathVariable String id, @RequestBody Map<String, Object> request,
                                               @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            PIP pip = pipRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("PIP not found"));

            if (!pip.getEmployeeId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> goalsData = (List<Map<String, Object>>) request.get("goals");
            List<Goal> updatedGoals = pip.getGoals().stream().map(goal -> {
                Map<String, Object> submitted = goalsData.stream()
                        .filter(g -> g.get("id").equals(goal.getId()))
                        .findFirst()
                        .orElse(null);
                if (submitted != null) {
                    goal.setJustification((String) submitted.get("justification"));
                    goal.setEmployeeAttachments((String) submitted.get("attachments"));
                }
                return goal;
            }).collect(Collectors.toList());

            pipService.updateGoals(id, updatedGoals, userId);
            pipService.updatePIPStatus(id, PIPStatus.PENDING_MANAGER_REVIEW, userId);

            PIPService.StepUpdateRequest stepUpdate = new PIPService.StepUpdateRequest();
            stepUpdate.setStatus(StepStatus.COMPLETED);
            stepUpdate.setSignedBy(userId);
            pipService.updateStep(id, "employee_self_review", stepUpdate);

            PIP updated = pipRepository.findById(id).orElse(pip);
            return ResponseEntity.ok(Map.of("pip", updated));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/manager-review")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> submitManagerReview(@PathVariable String id, @RequestBody Map<String, Object> request,
                                                  @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            PIP pip = pipRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("PIP not found"));

            if (!pip.getManagerId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> goalsData = (List<Map<String, Object>>) request.get("goals");
            List<Goal> updatedGoals = pip.getGoals().stream().map(goal -> {
                Map<String, Object> reviewed = goalsData.stream()
                        .filter(g -> g.get("id").equals(goal.getId()))
                        .findFirst()
                        .orElse(null);
                if (reviewed != null) {
                    goal.setStatus(GoalStatus.valueOf(((String) reviewed.get("status")).toUpperCase()));
                    goal.setManagerComments((String) reviewed.get("managerComments"));
                }
                return goal;
            }).collect(Collectors.toList());

            pipService.updateGoals(id, updatedGoals, userId);
            pipService.updatePIPStatus(id, PIPStatus.PENDING_HRBP_DECISION, userId);

            PIPService.StepUpdateRequest stepUpdate = new PIPService.StepUpdateRequest();
            stepUpdate.setStatus(StepStatus.COMPLETED);
            stepUpdate.setComments((String) request.get("comments"));
            stepUpdate.setSignedBy(userId);
            pipService.updateStep(id, "manager_review", stepUpdate);

            PIP updated = pipRepository.findById(id).orElse(pip);
            return ResponseEntity.ok(Map.of("pip", updated));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/final-decision")
    @PreAuthorize("hasRole('HRBP')")
    public ResponseEntity<?> submitFinalDecision(@PathVariable String id, @RequestBody Map<String, String> request,
                                                   @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            PIP pip = pipRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("PIP not found"));

            if (!pip.getHrbpId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            pip.setFinalOutcome(FinalOutcome.valueOf(request.get("outcome").toUpperCase()));
            pip.setFinalRemarks(request.get("remarks"));
            // Use CLOSED status for workflow termination (distinct from step COMPLETED)
            pip.setStatus(PIPStatus.CLOSED);
            pip.setLocked(true);
            
            // Calculate and store success criteria
            pip.setSuccessCriteriaMetadata(metadataService.createSuccessCriteriaMetadata(pip));
            
            // Store extension policy metadata
            pip.setExtensionPolicyMetadata(metadataService.createExtensionPolicyMetadata(pip));
            
            pipRepository.save(pip);

            PIPService.StepUpdateRequest stepUpdate = new PIPService.StepUpdateRequest();
            stepUpdate.setStatus(StepStatus.COMPLETED);
            stepUpdate.setComments(request.get("remarks"));
            stepUpdate.setSignedBy(userId);
            pipService.updateStep(id, "hrbp_decision", stepUpdate);

            PIP updated = pipRepository.findById(id).orElse(pip);
            
            // Filter out HRBP_REVIEW from active workflow steps (Issue 3 fix)
            // HRBP_REVIEW is the initial approval, not part of active workflow
            List<PIPStep> activeWorkflowSteps = updated.getSteps().stream()
                .filter(s -> s.getStep() != StepName.HRBP_REVIEW)
                .collect(java.util.stream.Collectors.toList());
            updated.setSteps(activeWorkflowSteps);
            
            return ResponseEntity.ok(Map.of("pip", updated));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/checkins")
    public ResponseEntity<?> addCheckIn(@PathVariable String id, @RequestBody Map<String, String> request,
                                        @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            PIP pip = pipRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("PIP not found"));

            // Check access
            String role = tokenProvider.getClaimsFromToken(token).get("role", String.class).toLowerCase();
            if (!canAccessPIP(userId, role, pip)) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Access denied",
                    "userId", userId,
                    "managerId", pip.getManagerId(),
                    "employeeId", pip.getEmployeeId(),
                    "hrbpId", pip.getHrbpId(),
                    "role", role
                ));
            }

            PIPService.CheckInRequest checkInRequest = new PIPService.CheckInRequest();
            checkInRequest.setDate(request.get("date"));
            checkInRequest.setNotes(request.get("notes"));
            checkInRequest.setAttachments(request.get("attachments"));

            CheckIn checkIn = pipService.addCheckIn(id, checkInRequest);
            return ResponseEntity.status(201).body(Map.of("checkIn", checkIn));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/complete-active")
    @PreAuthorize("hasAnyRole('MANAGER', 'HRBP', 'ADMIN')")
    public ResponseEntity<?> completeActivePeriod(@PathVariable String id, @RequestBody Map<String, Object> request,
                                                  @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            boolean forceComplete = request.get("forceComplete") != null && (Boolean) request.get("forceComplete");
            PIP pip = pipService.completeActivePeriod(id, userId, forceComplete);
            return ResponseEntity.ok(Map.of("pip", pip));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/deem-acknowledged")
    @PreAuthorize("hasRole('HRBP')")
    public ResponseEntity<?> deemAcknowledged(@PathVariable String id, @RequestBody Map<String, String> request,
                                               @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            PIP pip = escalationService.deemAcknowledged(id, userId, request.get("comments"));
            return ResponseEntity.ok(Map.of("pip", pip));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/hrbp-override-review")
    @PreAuthorize("hasRole('HRBP')")
    public ResponseEntity<?> hrbpOverrideReview(@PathVariable String id, @RequestBody Map<String, String> request,
                                                   @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            PIP pip = pipRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("PIP not found"));

            if (!pip.getHrbpId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            PIPStep managerStep = pip.getSteps().stream()
                    .filter(s -> s.getStep() == StepName.MANAGER_REVIEW)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Manager review step not found"));

            LocalDateTime now = LocalDateTime.now();
            managerStep.setStatus(StepStatus.COMPLETED);
            managerStep.setCompletedDate(now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            managerStep.setSignedBy(userId);
            managerStep.setComments("HRBP Override: " + (request.get("comments") != null ? request.get("comments") : "Manager review overdue, HRBP taking over"));

            pip.setManagerReviewCompletedAt(now);
            pip.setStatus(PIPStatus.PENDING_HRBP_DECISION);

            DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();
            deadlineCalculationService.recalculateDeadlines(pip, policy);

            PIP updated = pipRepository.save(pip);
            return ResponseEntity.ok(Map.of("pip", updated));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/deadline-policy")
    @PreAuthorize("hasAnyRole('MANAGER', 'HRBP', 'ADMIN')")
    public ResponseEntity<?> getDeadlinePolicy() {
        try {
            DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();
            return ResponseEntity.ok(policy);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/extend")
    @PreAuthorize("hasAnyRole('MANAGER', 'HRBP', 'ADMIN')")
    public ResponseEntity<?> extendPIP(@PathVariable String id, @RequestBody Map<String, Object> request,
                                       @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            PIP pip = pipRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("PIP not found"));

            // Check access
            String role = tokenProvider.getClaimsFromToken(token).get("role", String.class).toLowerCase();
            if (!canAccessPIP(userId, role, pip)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            // Validate extension request
            DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();
            int currentExtensionCount = pip.getExtensionCount() != null ? pip.getExtensionCount() : 0;
            
            if (currentExtensionCount >= policy.getMaxExtensionsAllowed()) {
                return ResponseEntity.status(400).body(Map.of("error", 
                    "Maximum extension limit reached. Max extensions allowed: " + policy.getMaxExtensionsAllowed()));
            }

            // Get new duration and justification
            Integer newDuration = request.get("newDuration") != null ? 
                ((Number) request.get("newDuration")).intValue() : null;
            String justification = (String) request.get("justification");

            if (newDuration == null || newDuration <= 0) {
                return ResponseEntity.status(400).body(Map.of("error", "Invalid new duration"));
            }

            if (justification == null || justification.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Justification is required for extension"));
            }

            // Validate new duration against policy
            if (!deadlinePolicyService.validateDeadlineValue("active_duration", newDuration, policy)) {
                return ResponseEntity.status(400).body(Map.of("error", 
                    "New duration must be between " + policy.getActiveDurationMinDays() + 
                    " and " + policy.getActiveDurationMaxDays() + " days"));
            }

            // Store original duration if first extension
            if (pip.getOriginalActiveDuration() == null) {
                pip.setOriginalActiveDuration(pip.getTimeline().getPipActiveDuration());
            }

            // Update active duration
            pip.getTimeline().setPipActiveDuration(newDuration);
            pip.setExtensionCount(currentExtensionCount + 1);

            // Recalculate deadlines
            deadlineCalculationService.recalculateDeadlines(pip, policy);

            pip.setVersion(pip.getVersion() + 1);
            PIP updated = pipRepository.save(pip);
            
            return ResponseEntity.ok(Map.of("pip", updated));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/timeline-override")
    @PreAuthorize("hasAnyRole('HRBP', 'ADMIN')")
    public ResponseEntity<?> overrideTimeline(@PathVariable String id, @RequestBody Map<String, Object> request,
                                              @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            PIP pip = pipRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("PIP not found"));

            String stepName = (String) request.get("step");
            String newDueDate = (String) request.get("newDueDate");
            String reason = (String) request.get("reason");

            if (stepName == null || newDueDate == null || reason == null) {
                return ResponseEntity.status(400).body(Map.of("error", 
                    "step, newDueDate, and reason are required"));
            }

            // Find the step
            PIPStep step = pip.getSteps().stream()
                    .filter(s -> s.getStep().name().equalsIgnoreCase(stepName.replace("_", "").replace("-", "")))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Step not found: " + stepName));

            // Update due date
            step.setDueDate(newDueDate);
            step.setComments("Timeline Override: " + reason + " (Overridden by: " + userId + ")");

            // Recalculate downstream deadlines if needed
            DeadlinePolicy policy = deadlinePolicyService.getActivePolicy();
            deadlineCalculationService.recalculateDeadlines(pip, policy);

            pip.setVersion(pip.getVersion() + 1);
            PIP updated = pipRepository.save(pip);
            
            return ResponseEntity.ok(Map.of("pip", updated));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/hrbp-review")
    @PreAuthorize("hasRole('HRBP')")
    public ResponseEntity<?> hrbpReview(@PathVariable String id, @RequestBody Map<String, Object> request,
                                        @RequestHeader("Authorization") String authHeader) {
        try {
            // This endpoint is an alias for hrbp-approve to match frontend expectations
            // Frontend may call this with action: 'approve' | 'deny' | 'send_back'
            String action = (String) request.get("action");
            String comments = (String) request.get("comments");

            if ("approve".equalsIgnoreCase(action)) {
                // Use the existing approve endpoint
                return approvePIPByHrbp(id, authHeader);
            } else if ("deny".equalsIgnoreCase(action)) {
                // Handle denial
                String token = authHeader.replace("Bearer ", "");
                String userId = tokenProvider.getUserIdFromToken(token);

                PIP pip = pipRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("PIP not found"));

                if (!pip.getHrbpId().equals(userId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
                }

                pip.setStatus(PIPStatus.CANCELLED);
                pip.setVersion(pip.getVersion() + 1);
                PIP updated = pipRepository.save(pip);
                
                return ResponseEntity.ok(Map.of("pip", updated));
            } else if ("send_back".equalsIgnoreCase(action)) {
                // Send back to manager for changes
                String token = authHeader.replace("Bearer ", "");
                String userId = tokenProvider.getUserIdFromToken(token);

                PIP pip = pipRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("PIP not found"));

                if (!pip.getHrbpId().equals(userId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
                }

                // Reset to draft or keep in pending_hrbp_review with comments
                PIPStep hrbpStep = pip.getSteps().stream()
                        .filter(s -> s.getStep() == StepName.HRBP_REVIEW)
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("HRBP review step not found"));

                hrbpStep.setComments(comments != null ? comments : "Sent back to manager for changes");
                pip.setVersion(pip.getVersion() + 1);
                PIP updated = pipRepository.save(pip);
                
                return ResponseEntity.ok(Map.of("pip", updated));
            } else {
                return ResponseEntity.status(400).body(Map.of("error", 
                    "Invalid action. Must be 'approve', 'deny', or 'send_back'"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/track-record-pdf")
    public ResponseEntity<?> getTrackRecordPDF(@PathVariable String id, @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);
            String role = tokenProvider.getClaimsFromToken(token).get("role", String.class).toLowerCase();

            PIP pip = pipRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("PIP not found"));

            // Check access
            if (!canAccessPIP(userId, role, pip)) {
                // Return detailed error for debugging (in production, remove sensitive info)
                return ResponseEntity.status(403)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of(
                            "error", "Access denied",
                            "message", "You do not have permission to access this PIP's track record",
                            "userId", userId != null ? userId : "null",
                            "userRole", role != null ? role : "null",
                            "pipEmployeeId", pip.getEmployeeId() != null ? pip.getEmployeeId() : "null",
                            "pipManagerId", pip.getManagerId() != null ? pip.getManagerId() : "null",
                            "pipHrbpId", pip.getHrbpId() != null ? pip.getHrbpId() : "null"
                        ));
            }

            // Generate PDF
            byte[] pdfBytes = pdfService.generateTrackRecordPDF(pip);

            // Create filename
            String employeeName = "Employee";
            if (pip.getEmployeeId() != null) {
                var employeeOpt = userRepository.findById(pip.getEmployeeId());
                if (employeeOpt.isPresent()) {
                    var employee = employeeOpt.get();
                    employeeName = employee.getFirstName() + "_" + employee.getLastName();
                }
            }

            String filename = String.format("PIP_TrackRecord_%s_%s_%s.pdf",
                employeeName.replace(" ", "_"),
                pip.getId().substring(0, Math.min(8, pip.getId().length())),
                java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd")));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(new ByteArrayResource(pdfBytes));
        } catch (Exception e) {
            e.printStackTrace();
            // Return JSON error response for proper error handling in frontend
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Failed to generate PDF: " + e.getMessage(), "details", e.getClass().getSimpleName()));
        }
    }

    private boolean canAccessPIP(String userId, String role, PIP pip) {
        if (userId == null || role == null || pip == null) {
            return false;
        }
        
        // Admin, executive, and HRBP roles have full access to all PIPs
        if ("admin".equals(role) || "executive".equals(role) || "hrbp".equals(role)) {
            return true;
        }
        
        // Check if user is the employee or manager of this specific PIP
        if (pip.getEmployeeId() != null && pip.getEmployeeId().equals(userId)) {
            return true;
        }
        if (pip.getManagerId() != null && pip.getManagerId().equals(userId)) {
            return true;
        }
        // Also check if user is the assigned HRBP (even if not HRBP role, they might be assigned)
        if (pip.getHrbpId() != null && pip.getHrbpId().equals(userId)) {
            return true;
        }
        
        return false;
    }
}

