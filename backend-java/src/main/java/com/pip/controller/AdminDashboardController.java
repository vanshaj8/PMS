package com.pip.controller;

import com.pip.security.JwtTokenProvider;
import com.pip.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'HRBP')")
public class AdminDashboardController {
    @Autowired
    private AdminDashboardService dashboardService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @GetMapping("/global-kpis")
    public ResponseEntity<?> getGlobalKPIs(@RequestHeader("Authorization") String token) {
        try {
            Map<String, Object> kpis = dashboardService.getGlobalKPIs();
            return ResponseEntity.ok(kpis);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/risk-alerts")
    public ResponseEntity<?> getRiskAlerts(@RequestHeader("Authorization") String token) {
        try {
            return ResponseEntity.ok(dashboardService.getRiskAlerts());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pip-snapshot")
    public ResponseEntity<?> getPIPSnapshot(@RequestHeader("Authorization") String token) {
        try {
            return ResponseEntity.ok(dashboardService.getPIPSnapshot());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/appraisal-snapshot")
    public ResponseEntity<?> getAppraisalSnapshot(@RequestHeader("Authorization") String token) {
        try {
            return ResponseEntity.ok(dashboardService.getAppraisalSnapshot());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/org-health")
    public ResponseEntity<?> getOrgHealth(@RequestHeader("Authorization") String token) {
        try {
            return ResponseEntity.ok(dashboardService.getOrgHealth());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllDashboardData(@RequestHeader("Authorization") String token) {
        try {
            Map<String, Object> dashboard = Map.of(
                "globalKPIs", dashboardService.getGlobalKPIs(),
                "riskAlerts", dashboardService.getRiskAlerts(),
                "pipSnapshot", dashboardService.getPIPSnapshot(),
                "appraisalSnapshot", dashboardService.getAppraisalSnapshot(),
                "orgHealth", dashboardService.getOrgHealth()
            );
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/rating-distribution")
    public ResponseEntity<?> getRatingDistribution(
            @RequestParam(required = false) String cycleId,
            @RequestHeader("Authorization") String token) {
        try {
            return ResponseEntity.ok(dashboardService.getRatingDistribution(cycleId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/performance-trends")
    public ResponseEntity<?> getPerformanceTrends(@RequestHeader("Authorization") String token) {
        try {
            return ResponseEntity.ok(dashboardService.getPerformanceTrends());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/manager-rating-variance")
    public ResponseEntity<?> getManagerRatingVariance(@RequestHeader("Authorization") String token) {
        try {
            return ResponseEntity.ok(dashboardService.getManagerRatingVariance());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/high-low-performers")
    public ResponseEntity<?> getHighLowPerformers(@RequestHeader("Authorization") String token) {
        try {
            return ResponseEntity.ok(dashboardService.getHighLowPerformers());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

