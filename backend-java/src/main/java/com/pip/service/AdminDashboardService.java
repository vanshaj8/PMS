package com.pip.service;

import com.pip.model.*;
import com.pip.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PIPRepository pipRepository;

    @Autowired
    private AppraisalCycleRepository cycleRepository;

    @Autowired
    private AppraisalParticipantRepository participantRepository;

    @Autowired
    private ReviewResponseRepository reviewResponseRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private AppraisalOutcomeRepository outcomeRepository;

    @Autowired
    private ReviewPhaseRepository phaseRepository;

    public Map<String, Object> getGlobalKPIs() {
        Map<String, Object> kpis = new HashMap<>();

        // Total Employees
        long totalEmployees = userRepository.findByIsActive(true).size();
        kpis.put("totalEmployees", totalEmployees);

        // Active PIPs
        long activePIPs = pipRepository.findByStatus(PIPStatus.ACTIVE).size();
        kpis.put("activePIPs", activePIPs);

        // Appraisal Cycles (Active & Upcoming)
        List<AppraisalCycle> activeCycles = cycleRepository.findByStatus(AppraisalCycleStatus.ACTIVE);
        List<AppraisalCycle> draftCycles = cycleRepository.findByStatus(AppraisalCycleStatus.DRAFT)
            .stream()
            .filter(c -> c.getStartDate().isAfter(LocalDate.now()) || 
                       c.getStartDate().isEqual(LocalDate.now()))
            .collect(Collectors.toList());
        kpis.put("appraisalCycles", activeCycles.size() + draftCycles.size());

        // Reviews Pending (PIP + Appraisal)
        long pipPending = pipRepository.findAll().stream()
            .filter(p -> p.getStatus() == PIPStatus.PENDING_HRBP_REVIEW ||
                        p.getStatus() == PIPStatus.PENDING_EMPLOYEE_ACKNOWLEDGEMENT ||
                        p.getStatus() == PIPStatus.PENDING_MANAGER_REVIEW ||
                        p.getStatus() == PIPStatus.PENDING_HRBP_DECISION)
            .count();

        long appraisalPending = 0;
        for (AppraisalCycle cycle : activeCycles) {
            List<AppraisalParticipant> participants = participantRepository.findByCycleId(cycle.getId());
            for (AppraisalParticipant p : participants) {
                if (!p.getSelfReviewSubmitted() || !p.getManagerReviewSubmitted()) {
                    appraisalPending++;
                }
            }
        }
        kpis.put("reviewsPending", pipPending + appraisalPending);

        // Overdue Actions
        long overduePIPs = pipRepository.findByStatus(PIPStatus.OVERDUE).size();
        
        long overdueAppraisals = 0;
        for (AppraisalCycle cycle : activeCycles) {
            List<ReviewPhase> phases = phaseRepository.findByCycleId(cycle.getId());
            for (ReviewPhase phase : phases) {
                if (phase.getEndDate().isBefore(LocalDate.now()) && !phase.getIsLocked()) {
                    // Count participants who haven't completed this phase
                    List<AppraisalParticipant> participants = participantRepository.findByCycleId(cycle.getId());
                    for (AppraisalParticipant p : participants) {
                        if (phase.getPhaseType() == PhaseType.SELF_REVIEW && !p.getSelfReviewSubmitted()) {
                            overdueAppraisals++;
                        } else if (phase.getPhaseType() == PhaseType.MANAGER_REVIEW && !p.getManagerReviewSubmitted()) {
                            overdueAppraisals++;
                        }
                    }
                }
            }
        }
        kpis.put("overdueActions", overduePIPs + overdueAppraisals);

        return kpis;
    }

    public List<Map<String, Object>> getRiskAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();

        // Overdue PIPs
        List<PIP> overduePIPs = pipRepository.findByStatus(PIPStatus.OVERDUE);
        if (!overduePIPs.isEmpty()) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "OVERDUE_PIPS");
            alert.put("severity", "RED");
            alert.put("title", "Overdue PIPs");
            alert.put("description", overduePIPs.size() + " PIP steps have missed deadlines");
            alert.put("count", overduePIPs.size());
            alert.put("action", "VIEW_PIPS");
            alerts.add(alert);
        }

        // Overdue Reviews
        List<AppraisalCycle> activeCycles = cycleRepository.findByStatus(AppraisalCycleStatus.ACTIVE);
        long overdueReviews = 0;
        for (AppraisalCycle cycle : activeCycles) {
            List<ReviewPhase> phases = phaseRepository.findByCycleId(cycle.getId());
            for (ReviewPhase phase : phases) {
                if (phase.getEndDate().isBefore(LocalDate.now()) && !phase.getIsLocked()) {
                    List<AppraisalParticipant> participants = participantRepository.findByCycleId(cycle.getId());
                    for (AppraisalParticipant p : participants) {
                        if (phase.getPhaseType() == PhaseType.SELF_REVIEW && !p.getSelfReviewSubmitted()) {
                            overdueReviews++;
                        } else if (phase.getPhaseType() == PhaseType.MANAGER_REVIEW && !p.getManagerReviewSubmitted()) {
                            overdueReviews++;
                        }
                    }
                }
            }
        }
        if (overdueReviews > 0) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "OVERDUE_REVIEWS");
            alert.put("severity", overdueReviews > 50 ? "RED" : "ORANGE");
            alert.put("title", "Overdue Reviews");
            alert.put("description", overdueReviews + " appraisal reviews not submitted");
            alert.put("count", overdueReviews);
            alert.put("action", "VIEW_REVIEWS");
            alerts.add(alert);
        }

        // Low Performer Spike
        List<AppraisalOutcome> recentOutcomes = outcomeRepository.findAll().stream()
            .filter(o -> o.getReleasedAt() != null && 
                        o.getReleasedAt().isAfter(LocalDateTime.now().minusMonths(1)))
            .collect(Collectors.toList());
        
        long lowPerformers = recentOutcomes.stream()
            .filter(o -> o.getFinalRating() != null && o.getFinalRating() < 2.5)
            .count();
        
        if (recentOutcomes.size() > 0) {
            double lowPerformerRate = (double) lowPerformers / recentOutcomes.size() * 100;
            if (lowPerformerRate > 20) { // More than 20% low performers
                Map<String, Object> alert = new HashMap<>();
                alert.put("type", "LOW_PERFORMER_SPIKE");
                alert.put("severity", lowPerformerRate > 30 ? "RED" : "ORANGE");
                alert.put("title", "Low Performer Spike");
                alert.put("description", String.format("%.1f%% increase in low ratings", lowPerformerRate));
                alert.put("count", lowPerformers);
                alert.put("action", "VIEW_ANALYTICS");
                alerts.add(alert);
            }
        }

        // Missing Hierarchy
        List<User> users = userRepository.findByIsActive(true);
        long missingManager = users.stream()
            .filter(u -> u.getManagerId() == null || u.getManagerId().isEmpty())
            .count();
        long missingHRBP = users.stream()
            .filter(u -> u.getHrbpId() == null || u.getHrbpId().isEmpty())
            .count();
        
        if (missingManager > 0 || missingHRBP > 0) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "MISSING_HIERARCHY");
            alert.put("severity", (missingManager + missingHRBP) > 10 ? "RED" : "ORANGE");
            alert.put("title", "Missing Hierarchy");
            alert.put("description", missingManager + " missing managers, " + missingHRBP + " missing HRBPs");
            alert.put("count", missingManager + missingHRBP);
            alert.put("action", "FIX_NOW");
            alerts.add(alert);
        }

        return alerts;
    }

    public Map<String, Object> getPIPSnapshot() {
        Map<String, Object> snapshot = new HashMap<>();

        List<PIP> allPIPs = pipRepository.findAll();
        long activePIPs = allPIPs.stream()
            .filter(p -> p.getStatus() == PIPStatus.ACTIVE)
            .count();
        
        long newPIPsThisMonth = allPIPs.stream()
            .filter(p -> p.getCreatedAt() != null &&
                        p.getCreatedAt().isAfter(LocalDateTime.now().minusMonths(1)))
            .count();

        List<PIP> completedPIPs = allPIPs.stream()
            .filter(p -> p.getStatus() == PIPStatus.COMPLETED)
            .collect(Collectors.toList());
        
        long successfulPIPs = completedPIPs.stream()
            .filter(p -> p.getFinalOutcome() != null && 
                        p.getFinalOutcome() == FinalOutcome.SUCCESSFUL)
            .count();
        
        double successRate = completedPIPs.size() > 0 
            ? (double) successfulPIPs / completedPIPs.size() * 100 
            : 0;
        
        double failureRate = completedPIPs.size() > 0 
            ? (double) (completedPIPs.size() - successfulPIPs) / completedPIPs.size() * 100 
            : 0;

        // Average duration
        double avgDuration = completedPIPs.stream()
            .mapToLong(p -> {
                if (p.getCreatedAt() != null && p.getUpdatedAt() != null) {
                    return ChronoUnit.DAYS.between(p.getCreatedAt(), p.getUpdatedAt());
                }
                return 0;
            })
            .average()
            .orElse(0);

        snapshot.put("activePIPs", activePIPs);
        snapshot.put("newPIPsThisMonth", newPIPsThisMonth);
        snapshot.put("successRate", Math.round(successRate * 100.0) / 100.0);
        snapshot.put("failureRate", Math.round(failureRate * 100.0) / 100.0);
        snapshot.put("avgDuration", Math.round(avgDuration * 100.0) / 100.0);

        // Breakdown by department
        Map<String, Long> byDepartment = allPIPs.stream()
            .collect(Collectors.groupingBy(
                pip -> {
                    Optional<User> user = userRepository.findById(pip.getEmployeeId());
                    return user.map(User::getDepartment).orElse("Unknown");
                },
                Collectors.counting()
            ));
        snapshot.put("byDepartment", byDepartment);

        // Breakdown by outcome
        Map<String, Long> byOutcome = allPIPs.stream()
            .filter(p -> p.getFinalOutcome() != null)
            .collect(Collectors.groupingBy(
                p -> p.getFinalOutcome().name(),
                Collectors.counting()
            ));
        snapshot.put("byOutcome", byOutcome);

        return snapshot;
    }

    public Map<String, Object> getAppraisalSnapshot() {
        Map<String, Object> snapshot = new HashMap<>();

        List<AppraisalCycle> activeCycles = cycleRepository.findByStatus(AppraisalCycleStatus.ACTIVE);
        List<AppraisalCycle> draftCycles = cycleRepository.findByStatus(AppraisalCycleStatus.DRAFT);

        // Cycle Status Table
        List<Map<String, Object>> cycleStatus = new ArrayList<>();
        for (AppraisalCycle cycle : activeCycles) {
            List<AppraisalParticipant> participants = participantRepository.findByCycleId(cycle.getId());
            long total = participants.size();
            long completed = participants.stream()
                .filter(p -> p.getFinalOutcomeReleased() != null && p.getFinalOutcomeReleased())
                .count();
            double completionRate = total > 0 ? (double) completed / total * 100 : 0;

            // Count overdue
            long overdue = 0;
            List<ReviewPhase> phases = phaseRepository.findByCycleId(cycle.getId());
            for (ReviewPhase phase : phases) {
                if (phase.getEndDate().isBefore(LocalDate.now()) && !phase.getIsLocked()) {
                    for (AppraisalParticipant p : participants) {
                        if (phase.getPhaseType() == PhaseType.SELF_REVIEW && !p.getSelfReviewSubmitted()) {
                            overdue++;
                        } else if (phase.getPhaseType() == PhaseType.MANAGER_REVIEW && !p.getManagerReviewSubmitted()) {
                            overdue++;
                        }
                    }
                }
            }

            Map<String, Object> status = new HashMap<>();
            status.put("cycleId", cycle.getId());
            status.put("cycleName", cycle.getCycleName());
            status.put("status", cycle.getStatus().name());
            status.put("completion", Math.round(completionRate * 100.0) / 100.0);
            status.put("overdue", overdue);
            cycleStatus.add(status);
        }

        snapshot.put("cycleStatus", cycleStatus);

        // KPIs
        long selfReviewsPending = 0;
        long managerReviewsPending = 0;
        long calibrationPending = 0;
        long finalized = 0;

        for (AppraisalCycle cycle : activeCycles) {
            List<AppraisalParticipant> participants = participantRepository.findByCycleId(cycle.getId());
            for (AppraisalParticipant p : participants) {
                if (!p.getSelfReviewSubmitted()) selfReviewsPending++;
                if (!p.getManagerReviewSubmitted()) managerReviewsPending++;
                if (p.getManagerReviewSubmitted() && !p.getCalibrated()) calibrationPending++;
                if (p.getFinalOutcomeReleased() != null && p.getFinalOutcomeReleased()) finalized++;
            }
        }

        snapshot.put("selfReviewsPending", selfReviewsPending);
        snapshot.put("managerReviewsPending", managerReviewsPending);
        snapshot.put("calibrationPending", calibrationPending);
        snapshot.put("finalized", finalized);
        snapshot.put("finalizedPercent", activeCycles.isEmpty() ? 0 : 
            Math.round((double) finalized / participantRepository.findByCycleId(activeCycles.get(0).getId()).size() * 100 * 100.0) / 100.0);

        return snapshot;
    }

    public Map<String, Object> getOrgHealth() {
        Map<String, Object> health = new HashMap<>();

        List<User> users = userRepository.findByIsActive(true);
        
        // Manager Load Distribution
        Map<String, Integer> managerLoad = new HashMap<>();
        for (User user : users) {
            if (user.getManagerId() != null && !user.getManagerId().isEmpty()) {
                managerLoad.put(user.getManagerId(), managerLoad.getOrDefault(user.getManagerId(), 0) + 1);
            }
        }

        List<Map<String, Object>> managerLoadData = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : managerLoad.entrySet()) {
            Optional<User> manager = userRepository.findById(entry.getKey());
            if (manager.isPresent()) {
                Map<String, Object> load = new HashMap<>();
                load.put("managerId", entry.getKey());
                load.put("managerName", manager.get().getFirstName() + " " + manager.get().getLastName());
                load.put("employeeCount", entry.getValue());
                load.put("status", entry.getValue() > 15 ? "OVERLOADED" : 
                         entry.getValue() > 10 ? "AT_RISK" : "BALANCED");
                managerLoadData.add(load);
            }
        }
        health.put("managerLoad", managerLoadData);

        // Hierarchy Health
        long missingManagers = users.stream()
            .filter(u -> u.getManagerId() == null || u.getManagerId().isEmpty())
            .count();
        long missingHRBPs = users.stream()
            .filter(u -> u.getHrbpId() == null || u.getHrbpId().isEmpty())
            .count();

        health.put("missingManagers", missingManagers);
        health.put("missingHRBPs", missingHRBPs);
        health.put("totalUsers", users.size());

        return health;
    }

    public Map<String, Object> getRatingDistribution(String cycleId) {
        Map<String, Object> distribution = new HashMap<>();
        
        if (cycleId != null && !cycleId.isEmpty()) {
            // Get distribution for specific cycle
            List<AppraisalParticipant> participants = participantRepository.findByCycleId(cycleId);
            List<Rating> ratings = new ArrayList<>();
            
            for (AppraisalParticipant p : participants) {
                Rating rating = ratingRepository.findByParticipantIdAndIsFinal(p.getId(), true)
                    .stream()
                    .findFirst()
                    .orElse(null);
                if (rating != null) {
                    ratings.add(rating);
                }
            }

            Map<String, Long> dist = ratings.stream()
                .collect(Collectors.groupingBy(
                    r -> r.getRatingLabel() != null ? r.getRatingLabel() : String.valueOf(r.getRatingValue()),
                    Collectors.counting()
                ));
            
            distribution.put("distribution", dist);
            distribution.put("total", ratings.size());
        } else {
            // Get overall distribution from all cycles
            List<AppraisalOutcome> outcomes = outcomeRepository.findAll();
            Map<String, Long> dist = outcomes.stream()
                .filter(o -> o.getFinalRatingLabel() != null)
                .collect(Collectors.groupingBy(
                    AppraisalOutcome::getFinalRatingLabel,
                    Collectors.counting()
                ));
            
            distribution.put("distribution", dist);
            distribution.put("total", outcomes.size());
        }

        return distribution;
    }

    public List<Map<String, Object>> getPerformanceTrends() {
        List<Map<String, Object>> trends = new ArrayList<>();
        
        // Get PIP trends (last 6 months)
        List<PIP> allPIPs = pipRepository.findAll();
        Map<String, Long> pipTrends = allPIPs.stream()
            .filter(p -> p.getCreatedAt() != null && 
                       p.getCreatedAt().isAfter(LocalDateTime.now().minusMonths(6)))
            .collect(Collectors.groupingBy(
                p -> p.getCreatedAt().toLocalDate().toString().substring(0, 7), // YYYY-MM
                Collectors.counting()
            ));

        // Get Appraisal trends
        List<AppraisalCycle> cycles = cycleRepository.findAll();
        Map<String, Long> appraisalTrends = cycles.stream()
            .filter(c -> c.getCreatedAt() != null &&
                       c.getCreatedAt().isAfter(LocalDateTime.now().minusMonths(6)))
            .collect(Collectors.groupingBy(
                c -> c.getCreatedAt().toLocalDate().toString().substring(0, 7),
                Collectors.counting()
            ));

        // Combine into monthly data
        LocalDate now = LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            String monthKey = month.toString().substring(0, 7);
            
            Map<String, Object> trend = new HashMap<>();
            trend.put("month", monthKey);
            trend.put("pips", pipTrends.getOrDefault(monthKey, 0L));
            trend.put("appraisals", appraisalTrends.getOrDefault(monthKey, 0L));
            trends.add(trend);
        }

        return trends;
    }

    public List<Map<String, Object>> getManagerRatingVariance() {
        List<Map<String, Object>> variance = new ArrayList<>();
        
        // Get all manager reviews with ratings
        List<Rating> managerRatings = ratingRepository.findAll().stream()
            .filter(r -> r.getRatingSource() == RatingSource.MANAGER)
            .collect(Collectors.toList());

        // Group by manager
        Map<String, List<Rating>> byManager = managerRatings.stream()
            .collect(Collectors.groupingBy(Rating::getRaterId));

        for (Map.Entry<String, List<Rating>> entry : byManager.entrySet()) {
            Optional<User> manager = userRepository.findById(entry.getKey());
            if (manager.isPresent()) {
                List<Rating> ratings = entry.getValue();
                double avgRating = ratings.stream()
                    .mapToDouble(Rating::getRatingValue)
                    .average()
                    .orElse(0);
                
                double varianceValue = ratings.stream()
                    .mapToDouble(r -> Math.pow(r.getRatingValue() - avgRating, 2))
                    .average()
                    .orElse(0);

                Map<String, Object> data = new HashMap<>();
                data.put("managerId", entry.getKey());
                data.put("managerName", manager.get().getFirstName() + " " + manager.get().getLastName());
                data.put("avgRating", Math.round(avgRating * 100.0) / 100.0);
                data.put("variance", Math.round(varianceValue * 100.0) / 100.0);
                data.put("count", ratings.size());
                variance.add(data);
            }
        }

        return variance.stream()
            .sorted((a, b) -> Double.compare((Double) b.get("variance"), (Double) a.get("variance")))
            .limit(10)
            .collect(Collectors.toList());
    }

    public Map<String, Object> getHighLowPerformers() {
        Map<String, Object> performers = new HashMap<>();
        
        List<AppraisalOutcome> outcomes = outcomeRepository.findAll();
        
        long highPerformers = outcomes.stream()
            .filter(o -> o.getFinalRating() != null && o.getFinalRating() >= 4.0)
            .count();
        
        long midPerformers = outcomes.stream()
            .filter(o -> o.getFinalRating() != null && 
                       o.getFinalRating() >= 2.5 && o.getFinalRating() < 4.0)
            .count();
        
        long lowPerformers = outcomes.stream()
            .filter(o -> o.getFinalRating() != null && o.getFinalRating() < 2.5)
            .count();

        performers.put("high", highPerformers);
        performers.put("mid", midPerformers);
        performers.put("low", lowPerformers);
        performers.put("total", outcomes.size());

        return performers;
    }
}

