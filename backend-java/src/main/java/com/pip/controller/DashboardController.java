package com.pip.controller;

import com.pip.model.PIP;
import com.pip.model.PIPStatus;
import com.pip.security.JwtTokenProvider;
import com.pip.service.PIPService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    @Autowired
    private PIPService pipService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);
            String role = tokenProvider.getClaimsFromToken(token).get("role", String.class).toLowerCase();

            List<PIP> pips = pipService.getAllPIPs(userId, role);

            int totalPIPs = pips.size();
            int activePIPs = (int) pips.stream()
                    .filter(p -> p.getStatus() == PIPStatus.ACTIVE)
                    .count();
            int pendingAction = (int) pips.stream()
                    .filter(p -> p.getStatus() == PIPStatus.PENDING_HRBP_REVIEW ||
                            p.getStatus() == PIPStatus.PENDING_EMPLOYEE_ACKNOWLEDGEMENT ||
                            p.getStatus() == PIPStatus.PENDING_MANAGER_REVIEW ||
                            p.getStatus() == PIPStatus.PENDING_HRBP_DECISION)
                    .count();
            int overduePIPs = (int) pips.stream()
                    .filter(p -> p.getStatus() == PIPStatus.OVERDUE)
                    .count();

            List<PIP> completedPIPs = pips.stream()
                    .filter(p -> p.getStatus() == PIPStatus.COMPLETED)
                    .collect(Collectors.toList());
            int successfulPIPs = (int) completedPIPs.stream()
                    .filter(p -> p.getFinalOutcome() != null && 
                            p.getFinalOutcome().name().equals("SUCCESSFUL"))
                    .count();
            double successRate = completedPIPs.size() > 0
                    ? (double) successfulPIPs / completedPIPs.size() * 100
                    : 0;

            // Calculate average duration
            double averageDuration = completedPIPs.stream()
                    .mapToLong(pip -> {
                        try {
                            LocalDateTime start = LocalDateTime.parse(pip.getCreatedAt().toString(), DATE_FORMATTER);
                            LocalDateTime end = LocalDateTime.parse(pip.getUpdatedAt().toString(), DATE_FORMATTER);
                            return java.time.Duration.between(start, end).toDays();
                        } catch (Exception e) {
                            return 0;
                        }
                    })
                    .average()
                    .orElse(0);

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalPIPs", totalPIPs);
            stats.put("activePIPs", activePIPs);
            stats.put("pendingAction", pendingAction);
            stats.put("overduePIPs", overduePIPs);
            stats.put("successRate", Math.round(successRate * 100.0) / 100.0);
            stats.put("averageDuration", Math.round(averageDuration * 100.0) / 100.0);

            return ResponseEntity.ok(Map.of("stats", stats));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pips-by-status")
    public ResponseEntity<?> getPIPsByStatus(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = tokenProvider.getUserIdFromToken(token);
            String role = tokenProvider.getClaimsFromToken(token).get("role", String.class).toLowerCase();

            List<PIP> pips = pipService.getAllPIPs(userId, role);

            Map<String, Integer> byStatus = new HashMap<>();
            pips.forEach(pip -> {
                String status = pip.getStatus().name().toLowerCase();
                byStatus.put(status, byStatus.getOrDefault(status, 0) + 1);
            });

            return ResponseEntity.ok(Map.of("byStatus", byStatus));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

