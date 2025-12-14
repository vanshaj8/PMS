package com.pip.controller;

import com.pip.model.*;
import com.pip.repository.PIPRepository;
import com.pip.security.JwtTokenProvider;
import com.pip.service.PIPService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
    private JwtTokenProvider tokenProvider;

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

    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<?> acknowledgePIP(@PathVariable String id, @RequestBody Map<String, String> request,
                                             @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);

            PIP pip = pipRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("PIP not found"));

            if (!pip.getEmployeeId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            pipService.updatePIPStatus(id, PIPStatus.ACTIVE, userId);
            PIPService.StepUpdateRequest stepUpdate = new PIPService.StepUpdateRequest();
            stepUpdate.setStatus(StepStatus.COMPLETED);
            stepUpdate.setComments(request.get("comments"));
            stepUpdate.setSignedBy(userId);
            pipService.updateStep(id, "employee_acknowledgement", stepUpdate);

            PIP updated = pipRepository.findById(id).orElse(pip);
            return ResponseEntity.ok(Map.of("pip", updated));
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
            pip.setStatus(PIPStatus.COMPLETED);
            pip.setLocked(true);
            pipRepository.save(pip);

            PIPService.StepUpdateRequest stepUpdate = new PIPService.StepUpdateRequest();
            stepUpdate.setStatus(StepStatus.COMPLETED);
            stepUpdate.setComments(request.get("remarks"));
            stepUpdate.setSignedBy(userId);
            pipService.updateStep(id, "hrbp_decision", stepUpdate);

            PIP updated = pipRepository.findById(id).orElse(pip);
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
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
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

    private boolean canAccessPIP(String userId, String role, PIP pip) {
        return "admin".equals(role) || "executive".equals(role) ||
                pip.getEmployeeId().equals(userId) ||
                pip.getManagerId().equals(userId) ||
                pip.getHrbpId().equals(userId);
    }
}

