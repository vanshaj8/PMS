package com.pip.controller;

import com.pip.model.*;
import com.pip.repository.*;
import com.pip.service.*;
import com.pip.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appraisals")
public class AppraisalController {
    @Autowired
    private AppraisalCycleService cycleService;

    @Autowired
    private ReviewFormService reviewFormService;

    @Autowired
    private RatingService ratingService;

    @Autowired
    private AppraisalCycleRepository cycleRepository;

    @Autowired
    private AppraisalParticipantRepository participantRepository;

    @Autowired
    private AppraisalGoalRepository goalRepository;

    @Autowired
    private ReviewResponseRepository responseRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private AppraisalOutcomeRepository outcomeRepository;

    @Autowired
    private CalibrationSessionRepository calibrationSessionRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    // ========== CYCLE MANAGEMENT ==========

    @PostMapping("/cycles")
    @PreAuthorize("hasAnyRole('ADMIN', 'HRBP')")
    public ResponseEntity<?> createCycle(@RequestBody AppraisalCycleService.CreateAppraisalCycleRequest request,
                                          @RequestHeader("Authorization") String token) {
        try {
            String userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            request.setCreatedBy(userId);
            AppraisalCycle cycle = cycleService.createCycle(request);
            return ResponseEntity.ok(cycle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/cycles")
    public ResponseEntity<?> getAllCycles() {
        try {
            List<AppraisalCycle> cycles = cycleService.getAllCycles();
            return ResponseEntity.ok(cycles);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/cycles/active")
    public ResponseEntity<?> getActiveCycles() {
        try {
            List<AppraisalCycle> cycles = cycleService.getActiveCycles();
            return ResponseEntity.ok(cycles);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/cycles/{cycleId}")
    public ResponseEntity<?> getCycle(@PathVariable String cycleId) {
        try {
            AppraisalCycle cycle = cycleService.getCycleById(cycleId);
            return ResponseEntity.ok(cycle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cycles/{cycleId}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HRBP')")
    public ResponseEntity<?> activateCycle(@PathVariable String cycleId) {
        try {
            AppraisalCycle cycle = cycleService.activateCycle(cycleId);
            return ResponseEntity.ok(cycle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== PARTICIPANT MANAGEMENT ==========

    @GetMapping("/cycles/{cycleId}/participants")
    public ResponseEntity<?> getParticipants(@PathVariable String cycleId) {
        try {
            List<AppraisalParticipant> participants = cycleService.getCycleParticipants(cycleId);
            return ResponseEntity.ok(participants);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/cycles/{cycleId}/participants/{employeeId}")
    public ResponseEntity<?> getParticipant(@PathVariable String cycleId, @PathVariable String employeeId) {
        try {
            AppraisalParticipant participant = cycleService.getParticipant(cycleId, employeeId);
            return ResponseEntity.ok(participant);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/participants/my-appraisals")
    public ResponseEntity<?> getMyAppraisals(@RequestHeader("Authorization") String token) {
        try {
            String userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            List<AppraisalParticipant> participants = participantRepository.findByEmployeeId(userId);
            return ResponseEntity.ok(participants);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/participants/my-team")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'HRBP')")
    public ResponseEntity<?> getMyTeamAppraisals(@RequestHeader("Authorization") String token) {
        try {
            String userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            List<AppraisalParticipant> participants = participantRepository.findByManagerId(userId);
            return ResponseEntity.ok(participants);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== GOAL MANAGEMENT ==========

    @GetMapping("/participants/{participantId}/goals")
    public ResponseEntity<?> getGoals(@PathVariable String participantId) {
        try {
            List<AppraisalGoal> goals = goalRepository.findByParticipantId(participantId);
            return ResponseEntity.ok(goals);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/participants/{participantId}/goals/lock")
    @PreAuthorize("hasAnyRole('ADMIN', 'HRBP', 'MANAGER')")
    public ResponseEntity<?> lockGoals(@PathVariable String participantId,
                                      @RequestParam String cycleId) {
        try {
            cycleService.lockGoals(cycleId, participantId);
            return ResponseEntity.ok(Map.of("message", "Goals locked successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== REVIEW FORMS ==========

    @PostMapping("/forms")
    @PreAuthorize("hasAnyRole('ADMIN', 'HRBP')")
    public ResponseEntity<?> createForm(@RequestBody ReviewFormService.CreateReviewFormRequest request,
                                       @RequestHeader("Authorization") String token) {
        try {
            String userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            request.setCreatedBy(userId);
            ReviewForm form = reviewFormService.createForm(request);
            return ResponseEntity.ok(form);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/cycles/{cycleId}/forms")
    public ResponseEntity<?> getForms(@PathVariable String cycleId) {
        try {
            List<ReviewForm> forms = reviewFormService.getFormsByCycle(cycleId);
            return ResponseEntity.ok(forms);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== REVIEW RESPONSES ==========

    @PostMapping("/responses")
    public ResponseEntity<?> submitResponse(@RequestBody ReviewFormService.SubmitReviewResponseRequest request,
                                            @RequestHeader("Authorization") String token) {
        try {
            String userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            request.setReviewerId(userId);
            ReviewResponse response = reviewFormService.submitResponse(request);
            
            // Auto-calculate rating if submitted
            if (request.getSubmit()) {
                RatingSource source = mapReviewTypeToRatingSource(request.getReviewType());
                ratingService.calculateAndSaveRating(request.getParticipantId(), source, userId);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/participants/{participantId}/responses")
    public ResponseEntity<?> getResponses(@PathVariable String participantId) {
        try {
            List<ReviewResponse> responses = reviewFormService.getResponsesByParticipant(participantId);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== RATINGS ==========

    @GetMapping("/participants/{participantId}/ratings")
    public ResponseEntity<?> getRatings(@PathVariable String participantId) {
        try {
            List<Rating> ratings = ratingRepository.findByParticipantId(participantId);
            return ResponseEntity.ok(ratings);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/participants/{participantId}/ratings/calibrate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HRBP')")
    public ResponseEntity<?> calibrateRating(@PathVariable String participantId,
                                            @RequestBody Map<String, Object> request,
                                            @RequestHeader("Authorization") String token) {
        try {
            String userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            Double calibratedRating = Double.parseDouble(request.get("calibratedRating").toString());
            String justification = request.get("justification").toString();
            
            Rating rating = ratingService.calibrateRating(participantId, calibratedRating, justification, userId);
            return ResponseEntity.ok(rating);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/cycles/{cycleId}/distribution")
    @PreAuthorize("hasAnyRole('ADMIN', 'HRBP')")
    public ResponseEntity<?> getDistribution(@PathVariable String cycleId) {
        try {
            Map<String, Object> distribution = ratingService.calculateDistribution(cycleId);
            return ResponseEntity.ok(distribution);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== OUTCOMES ==========

    @GetMapping("/participants/{participantId}/outcome")
    public ResponseEntity<?> getOutcome(@PathVariable String participantId) {
        try {
            AppraisalOutcome outcome = outcomeRepository.findByParticipantId(participantId)
                .orElse(null);
            return ResponseEntity.ok(outcome);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== DASHBOARD METRICS ==========

    @GetMapping("/cycles/{cycleId}/metrics")
    @PreAuthorize("hasAnyRole('ADMIN', 'HRBP')")
    public ResponseEntity<?> getCycleMetrics(@PathVariable String cycleId) {
        try {
            List<AppraisalParticipant> participants = participantRepository.findByCycleId(cycleId);
            long total = participants.size();
            long goalsLocked = participants.stream().filter(p -> p.getGoalsLocked() != null && p.getGoalsLocked()).count();
            long selfReviewSubmitted = participants.stream().filter(p -> p.getSelfReviewSubmitted() != null && p.getSelfReviewSubmitted()).count();
            long managerReviewSubmitted = participants.stream().filter(p -> p.getManagerReviewSubmitted() != null && p.getManagerReviewSubmitted()).count();
            long calibrated = participants.stream().filter(p -> p.getCalibrated() != null && p.getCalibrated()).count();
            long outcomeReleased = participants.stream().filter(p -> p.getFinalOutcomeReleased() != null && p.getFinalOutcomeReleased()).count();

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalParticipants", total);
            metrics.put("goalsLocked", goalsLocked);
            metrics.put("selfReviewSubmitted", selfReviewSubmitted);
            metrics.put("managerReviewSubmitted", managerReviewSubmitted);
            metrics.put("calibrated", calibrated);
            metrics.put("outcomeReleased", outcomeReleased);
            metrics.put("completionRate", total > 0 ? (outcomeReleased * 100.0 / total) : 0.0);

            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private RatingSource mapReviewTypeToRatingSource(ReviewType reviewType) {
        switch (reviewType) {
            case SELF_REVIEW: return RatingSource.SELF;
            case MANAGER_REVIEW: return RatingSource.MANAGER;
            case SKIP_REVIEW: return RatingSource.SKIP_LEVEL;
            case PEER_REVIEW: return RatingSource.PEER;
            case HR_REVIEW: return RatingSource.HR;
            default: throw new RuntimeException("Invalid review type: " + reviewType);
        }
    }
}

