package com.pip.goals.controller;

import com.pip.goals.model.Goal;
import com.pip.goals.service.GoalService;
import com.pip.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Goals API Controller
 * Centralized goals management
 */
@RestController
@RequestMapping("/api/goals")
public class GoalController {
    @Autowired
    private GoalService goalService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    /**
     * Get all goals for a user
     * GET /api/goals/users/{userId}
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserGoals(
            @PathVariable String userId,
            @RequestParam(required = false) Boolean includeArchived,
            @RequestHeader("Authorization") String token) {
        try {
            String currentUserId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            
            // Permission check: user can view their own goals, managers/HR can view team goals
            // Simplified for now - add proper permission check
            
            List<Goal> goals = goalService.getUserGoals(userId, includeArchived);
            return ResponseEntity.ok(Map.of("goals", goals));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Create a new goal
     * POST /api/goals
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'HRBP', 'ADMIN')")
    public ResponseEntity<?> createGoal(
            @RequestBody GoalService.CreateGoalRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            String userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            request.setCreatedBy(userId);
            
            Goal goal = goalService.createGoal(request);
            return ResponseEntity.ok(goal);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update goal (creates new version if locked)
     * PUT /api/goals/{goalId}
     */
    @PutMapping("/{goalId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HRBP', 'ADMIN')")
    public ResponseEntity<?> updateGoal(
            @PathVariable String goalId,
            @RequestBody GoalService.UpdateGoalRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            String userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            request.setUpdatedBy(userId);
            
            Goal goal = goalService.updateGoal(goalId, request);
            return ResponseEntity.ok(goal);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get goal with version history
     * GET /api/goals/{goalId}/history
     */
    @GetMapping("/{goalId}/history")
    public ResponseEntity<?> getGoalHistory(
            @PathVariable String goalId,
            @RequestHeader("Authorization") String token) {
        try {
            GoalService.GoalWithHistory history = goalService.getGoalWithHistory(goalId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Lock goal
     * POST /api/goals/{goalId}/lock
     */
    @PostMapping("/{goalId}/lock")
    @PreAuthorize("hasAnyRole('MANAGER', 'HRBP', 'ADMIN')")
    public ResponseEntity<?> lockGoal(
            @PathVariable String goalId,
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String token) {
        try {
            String userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            String lockReason = request.get("lockReason");
            
            Goal goal = goalService.lockGoal(goalId, userId, lockReason);
            return ResponseEntity.ok(goal);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Link goals to PIP
     * POST /api/goals/pip/{pipId}/attach
     */
    @PostMapping("/pip/{pipId}/attach")
    @PreAuthorize("hasAnyRole('MANAGER', 'HRBP', 'ADMIN')")
    public ResponseEntity<?> attachGoalsToPIP(
            @PathVariable String pipId,
            @RequestBody Map<String, Object> request,
            @RequestHeader("Authorization") String token) {
        try {
            String userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            @SuppressWarnings("unchecked")
            List<String> goalIds = (List<String>) request.get("goalIds");
            
            goalService.linkGoalsToPIP(pipId, goalIds, userId);
            return ResponseEntity.ok(Map.of("message", "Goals attached to PIP successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Create appraisal snapshot
     * POST /api/goals/appraisal/{cycleId}/snapshot
     */
    @PostMapping("/appraisal/{cycleId}/snapshot")
    @PreAuthorize("hasAnyRole('HRBP', 'ADMIN')")
    public ResponseEntity<?> createAppraisalSnapshot(
            @PathVariable String cycleId,
            @RequestBody Map<String, Object> request,
            @RequestHeader("Authorization") String token) {
        try {
            String userId = jwtTokenProvider.getUserIdFromToken(token.replace("Bearer ", ""));
            String participantId = (String) request.get("participantId");
            @SuppressWarnings("unchecked")
            List<String> goalIds = (List<String>) request.get("goalIds");
            
            goalService.createAppraisalSnapshot(cycleId, participantId, goalIds, userId);
            return ResponseEntity.ok(Map.of("message", "Appraisal snapshot created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

