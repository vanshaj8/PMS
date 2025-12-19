package com.pip.controller;

import com.pip.model.PIP;
import com.pip.model.PIPStatus;
import com.pip.model.User;
import com.pip.model.UserRole;
import com.pip.repository.PIPRepository;
import com.pip.repository.UserRepository;
import com.pip.security.JwtTokenProvider;
import com.pip.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user-management")
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PIPRepository pipRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestBody Map<String, Object> filters) {
        try {
            // Use database-level filtering with JPA Specifications
            org.springframework.data.jpa.domain.Specification<User> spec = 
                com.pip.repository.UserSpecification.buildSpecification(filters);
            
            List<User> filteredUsers = userRepository.findAll(spec);
            List<UserSearchResult> results = new ArrayList<>();

            for (User user : filteredUsers) {
                UserSearchResult result = new UserSearchResult();
                result.user = createUserMap(user);

                // Get manager
                if (user.getManagerId() != null) {
                    userRepository.findById(user.getManagerId()).ifPresent(manager -> {
                        result.manager = createUserMap(manager);
                    });
                }

                // Get HRBP
                if (user.getHrbpId() != null) {
                    userRepository.findById(user.getHrbpId()).ifPresent(hrbp -> {
                        result.hrbp = createUserMap(hrbp);
                    });
                }

                // Count PIPs using database queries
                result.pipCount = (int) pipRepository.findAll().stream()
                    .filter(pip -> pip.getEmployeeId().equals(user.getId()) ||
                                  pip.getManagerId().equals(user.getId()) ||
                                  pip.getHrbpId().equals(user.getId()))
                    .count();
                
                result.activePipCount = (int) pipRepository.findAll().stream()
                    .filter(pip -> (pip.getEmployeeId().equals(user.getId()) ||
                                   pip.getManagerId().equals(user.getId()) ||
                                   pip.getHrbpId().equals(user.getId())) &&
                                  pip.getStatus() == PIPStatus.ACTIVE)
                    .count();
                
                result.completedPipCount = (int) pipRepository.findAll().stream()
                    .filter(pip -> (pip.getEmployeeId().equals(user.getId()) ||
                                   pip.getManagerId().equals(user.getId()) ||
                                   pip.getHrbpId().equals(user.getId())) &&
                                  (pip.getStatus() == PIPStatus.COMPLETED || pip.getStatus() == PIPStatus.CLOSED))
                    .count();

                results.add(result);
            }

            return ResponseEntity.ok(Map.of("results", results));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{userId}/pips")
    public ResponseEntity<?> getUserPIPs(@PathVariable String userId) {
        try {
            // Use repository method for efficient database query
            List<PIP> userPips = pipRepository.findByEmployeeIdOrManagerIdOrHrbpId(userId, userId, userId);
            
            return ResponseEntity.ok(Map.of("pips", userPips));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{userId}/details")
    public ResponseEntity<?> getUserDetails(@PathVariable String userId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            UserSearchResult result = new UserSearchResult();
            result.user = createUserMap(user);

            if (user.getManagerId() != null) {
                userRepository.findById(user.getManagerId()).ifPresent(manager -> {
                    result.manager = createUserMap(manager);
                });
            }

            if (user.getHrbpId() != null) {
                userRepository.findById(user.getHrbpId()).ifPresent(hrbp -> {
                    result.hrbp = createUserMap(hrbp);
                });
            }

            List<PIP> userPips = pipRepository.findAll().stream()
                .filter(pip -> pip.getEmployeeId().equals(userId) ||
                              pip.getManagerId().equals(userId) ||
                              pip.getHrbpId().equals(userId))
                .collect(Collectors.toList());

            result.pipCount = userPips.size();
            result.activePipCount = (int) userPips.stream()
                .filter(pip -> pip.getStatus() == PIPStatus.ACTIVE)
                .count();
            result.completedPipCount = (int) userPips.stream()
                .filter(pip -> pip.getStatus() == PIPStatus.COMPLETED || pip.getStatus() == PIPStatus.CLOSED)
                .count();

            return ResponseEntity.ok(Map.of("result", result));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{userId}/assign-manager")
    public ResponseEntity<?> assignManager(@PathVariable String userId, @RequestBody Map<String, String> request) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            String managerId = request.get("managerId");
            if (managerId != null) {
                userRepository.findById(managerId)
                    .orElseThrow(() -> new RuntimeException("Manager not found"));
                user.setManagerId(managerId);
            } else {
                user.setManagerId(null);
            }

            User updated = userRepository.save(user);
            return ResponseEntity.ok(Map.of("user", createUserMap(updated)));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{userId}/assign-hrbp")
    public ResponseEntity<?> assignHRBP(@PathVariable String userId, @RequestBody Map<String, String> request) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            String hrbpId = request.get("hrbpId");
            if (hrbpId != null) {
                userRepository.findById(hrbpId)
                    .orElseThrow(() -> new RuntimeException("HRBP not found"));
                user.setHrbpId(hrbpId);
            } else {
                user.setHrbpId(null);
            }

            User updated = userRepository.save(user);
            return ResponseEntity.ok(Map.of("user", createUserMap(updated)));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{userId}/profile")
    public ResponseEntity<?> updateUserProfile(@PathVariable String userId, @RequestBody Map<String, Object> updates) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            if (updates.containsKey("firstName")) user.setFirstName(updates.get("firstName").toString());
            if (updates.containsKey("lastName")) user.setLastName(updates.get("lastName").toString());
            if (updates.containsKey("preferredName")) user.setPreferredName(updates.get("preferredName") != null ? updates.get("preferredName").toString() : null);
            if (updates.containsKey("email")) user.setEmail(updates.get("email").toString());
            if (updates.containsKey("phoneNumber")) user.setPhoneNumber(updates.get("phoneNumber") != null ? updates.get("phoneNumber").toString() : null);
            if (updates.containsKey("profilePhoto")) user.setProfilePhoto(updates.get("profilePhoto") != null ? updates.get("profilePhoto").toString() : null);
            if (updates.containsKey("role")) {
                user.setRole(UserRole.valueOf(updates.get("role").toString().toUpperCase()));
            }
            if (updates.containsKey("jobTitle")) user.setJobTitle(updates.get("jobTitle") != null ? updates.get("jobTitle").toString() : null);
            if (updates.containsKey("department")) user.setDepartment(updates.get("department") != null ? updates.get("department").toString() : null);
            if (updates.containsKey("businessUnit")) user.setBusinessUnit(updates.get("businessUnit") != null ? updates.get("businessUnit").toString() : null);
            if (updates.containsKey("location")) user.setLocation(updates.get("location") != null ? updates.get("location").toString() : null);
            if (updates.containsKey("employmentType")) {
                try {
                    user.setEmploymentType(com.pip.model.EmploymentType.valueOf(updates.get("employmentType").toString().toUpperCase()));
                } catch (Exception e) {
                    // Invalid enum value, skip
                }
            }
            if (updates.containsKey("dateOfJoining")) {
                try {
                    user.setDateOfJoining(java.time.LocalDate.parse(updates.get("dateOfJoining").toString()));
                } catch (Exception e) {
                    // Invalid date format, skip
                }
            }
            if (updates.containsKey("employmentLevel")) user.setEmploymentLevel(updates.get("employmentLevel") != null ? updates.get("employmentLevel").toString() : null);
            if (updates.containsKey("costCenter")) user.setCostCenter(updates.get("costCenter") != null ? updates.get("costCenter").toString() : null);
            if (updates.containsKey("isActive")) {
                user.setIsActive(Boolean.parseBoolean(updates.get("isActive").toString()));
            }

            User updated = userRepository.save(user);
            return ResponseEntity.ok(Map.of("user", createUserMap(updated)));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{userId}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable String userId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            user.setIsActive(false);
            User updated = userRepository.save(user);
            return ResponseEntity.ok(Map.of("user", createUserMap(updated)));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/bulk/assign-manager")
    public ResponseEntity<?> bulkAssignManager(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> userIds = (List<String>) request.get("userIds");
            String managerId = request.get("managerId").toString();

            int succeeded = 0;
            int failed = 0;
            List<Map<String, String>> errors = new ArrayList<>();

            for (String userId : userIds) {
                try {
                    User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                    user.setManagerId(managerId);
                    userRepository.save(user);
                    succeeded++;
                } catch (Exception e) {
                    failed++;
                    Map<String, String> error = new HashMap<>();
                    error.put("userId", userId);
                    error.put("error", e.getMessage());
                    errors.add(error);
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("processed", userIds.size());
            result.put("succeeded", succeeded);
            result.put("failed", failed);
            result.put("errors", errors);

            return ResponseEntity.ok(Map.of("result", result));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/bulk/assign-hrbp")
    public ResponseEntity<?> bulkAssignHRBP(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> userIds = (List<String>) request.get("userIds");
            String hrbpId = request.get("hrbpId").toString();

            int succeeded = 0;
            int failed = 0;
            List<Map<String, String>> errors = new ArrayList<>();

            for (String userId : userIds) {
                try {
                    User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                    user.setHrbpId(hrbpId);
                    userRepository.save(user);
                    succeeded++;
                } catch (Exception e) {
                    failed++;
                    Map<String, String> error = new HashMap<>();
                    error.put("userId", userId);
                    error.put("error", e.getMessage());
                    errors.add(error);
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("processed", userIds.size());
            result.put("succeeded", succeeded);
            result.put("failed", failed);
            result.put("errors", errors);

            return ResponseEntity.ok(Map.of("result", result));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/bulk/deactivate")
    public ResponseEntity<?> bulkDeactivate(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> userIds = (List<String>) request.get("userIds");

            int succeeded = 0;
            int failed = 0;
            List<Map<String, String>> errors = new ArrayList<>();

            for (String userId : userIds) {
                try {
                    User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                    user.setIsActive(false);
                    userRepository.save(user);
                    succeeded++;
                } catch (Exception e) {
                    failed++;
                    Map<String, String> error = new HashMap<>();
                    error.put("userId", userId);
                    error.put("error", e.getMessage());
                    errors.add(error);
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("processed", userIds.size());
            result.put("succeeded", succeeded);
            result.put("failed", failed);
            result.put("errors", errors);

            return ResponseEntity.ok(Map.of("result", result));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/manager-load")
    public ResponseEntity<?> getManagerLoadDistribution() {
        try {
            List<User> managers = userRepository.findByRole(UserRole.MANAGER);
            List<Map<String, Object>> distribution = new ArrayList<>();

            for (User manager : managers) {
                long employeeCount = userRepository.findAll().stream()
                    .filter(u -> manager.getId().equals(u.getManagerId()))
                    .count();

                Map<String, Object> entry = new HashMap<>();
                entry.put("manager", createUserMap(manager));
                entry.put("employeeCount", (int) employeeCount);
                distribution.add(entry);
            }

            // Sort by employee count descending
            distribution.sort((a, b) -> 
                Integer.compare((int) b.get("employeeCount"), (int) a.get("employeeCount")));

            return ResponseEntity.ok(Map.of("distribution", distribution));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/hierarchy-health")
    public ResponseEntity<?> getHierarchyHealth() {
        try {
            List<User> allUsers = userRepository.findAll();
            int totalUsers = allUsers.size();

            long usersWithManager = allUsers.stream()
                .filter(u -> u.getManagerId() != null && !u.getManagerId().isEmpty())
                .count();

            long usersWithHRBP = allUsers.stream()
                .filter(u -> u.getHrbpId() != null && !u.getHrbpId().isEmpty())
                .count();

            long missingManager = totalUsers - usersWithManager;
            long missingHRBP = totalUsers - usersWithHRBP;

            // Check for circular reporting (simplified - would need graph traversal for full check)
            long circularReporting = 0;
            long selfReporting = 0;

            for (User user : allUsers) {
                if (user.getManagerId() != null && user.getManagerId().equals(user.getId())) {
                    selfReporting++;
                }
                // Circular check: if A's manager is B, and B's manager is A
                if (user.getManagerId() != null) {
                    Optional<User> manager = userRepository.findById(user.getManagerId());
                    if (manager.isPresent() && user.getId().equals(manager.get().getManagerId())) {
                        circularReporting++;
                    }
                }
            }

            Map<String, Object> health = new HashMap<>();
            health.put("totalUsers", totalUsers);
            health.put("usersWithManager", (int) usersWithManager);
            health.put("usersWithHRBP", (int) usersWithHRBP);
            health.put("missingManager", (int) missingManager);
            health.put("missingHRBP", (int) missingHRBP);
            health.put("circularReporting", (int) circularReporting);
            health.put("selfReporting", (int) selfReporting);

            return ResponseEntity.ok(Map.of("health", health));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> createUserMap(User user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("email", user.getEmail());
        userMap.put("firstName", user.getFirstName());
        userMap.put("lastName", user.getLastName());
        userMap.put("preferredName", user.getPreferredName());
        userMap.put("phoneNumber", user.getPhoneNumber());
        userMap.put("profilePhoto", user.getProfilePhoto());
        userMap.put("role", user.getRole().name().toLowerCase());
        userMap.put("jobTitle", user.getJobTitle());
        userMap.put("department", user.getDepartment());
        userMap.put("businessUnit", user.getBusinessUnit());
        userMap.put("location", user.getLocation());
        userMap.put("employmentType", user.getEmploymentType() != null ? user.getEmploymentType().name() : null);
        userMap.put("dateOfJoining", user.getDateOfJoining() != null ? user.getDateOfJoining().toString() : null);
        userMap.put("employmentLevel", user.getEmploymentLevel());
        userMap.put("costCenter", user.getCostCenter());
        userMap.put("managerId", user.getManagerId());
        userMap.put("hrbpId", user.getHrbpId());
        userMap.put("skipLevelManagerId", user.getSkipLevelManagerId());
        userMap.put("isActive", user.getIsActive());
        userMap.put("lastLogin", user.getLastLogin() != null ? user.getLastLogin().toString() : null);
        userMap.put("mfaEnabled", user.getMfaEnabled());
        return userMap;
    }

    private static class UserSearchResult {
        public Map<String, Object> user;
        public Map<String, Object> manager;
        public Map<String, Object> hrbp;
        public int pipCount;
        public int activePipCount;
        public int completedPipCount;
    }
}

