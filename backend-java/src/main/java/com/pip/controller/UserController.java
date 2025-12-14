package com.pip.controller;

import com.pip.model.User;
import com.pip.model.UserRole;
import com.pip.security.JwtTokenProvider;
import com.pip.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            List<Map<String, Object>> usersWithoutPasswords = users.stream()
                    .map(this::createUserResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(Map.of("users", usersWithoutPasswords));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/for-pip-creation")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> getUsersForPIPCreation() {
        try {
            List<User> allUsers = userService.getAllUsers();
            List<User> activeUsers = allUsers.stream()
                    .filter(u -> u.getIsActive() != null && u.getIsActive())
                    .filter(u -> u.getRole() == UserRole.EMPLOYEE || u.getRole() == UserRole.HRBP)
                    .collect(Collectors.toList());

            List<Map<String, Object>> employees = activeUsers.stream()
                    .filter(u -> u.getRole() == UserRole.EMPLOYEE)
                    .map(this::createUserResponse)
                    .collect(Collectors.toList());

            List<Map<String, Object>> hrbps = activeUsers.stream()
                    .filter(u -> u.getRole() == UserRole.HRBP)
                    .map(this::createUserResponse)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("employees", employees);
            response.put("hrbps", hrbps);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        try {
            User user = userService.getUserById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(Map.of("user", createUserResponse(user)));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            User created = userService.createUser(user);
            return ResponseEntity.status(201).body(Map.of("user", createUserResponse(created)));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody User updates) {
        try {
            User updated = userService.updateUser(id, updates);
            return ResponseEntity.ok(Map.of("user", createUserResponse(updated)));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> createUserResponse(User user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("email", user.getEmail());
        userMap.put("firstName", user.getFirstName());
        userMap.put("lastName", user.getLastName());
        userMap.put("role", user.getRole().name().toLowerCase());
        userMap.put("department", user.getDepartment());
        userMap.put("location", user.getLocation());
        userMap.put("managerId", user.getManagerId());
        userMap.put("hrbpId", user.getHrbpId());
        userMap.put("isActive", user.getIsActive());
        return userMap;
    }
}

