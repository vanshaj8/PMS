package com.pip.service;

import com.pip.model.User;
import com.pip.model.UserRole;
import com.pip.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    @Lazy
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole())))
                .accountExpired(false)
                .accountLocked(!user.getIsActive())
                .credentialsExpired(false)
                .disabled(!user.getIsActive())
                .build();
    }

    public UserDetails loadUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole())))
                .accountExpired(false)
                .accountLocked(!user.getIsActive())
                .credentialsExpired(false)
                .disabled(!user.getIsActive())
                .build();
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    public List<User> getActiveUsersByRole(UserRole role) {
        return userRepository.findByRoleAndIsActive(role, true);
    }

    @Transactional
    public User createUser(User user) {
        if (userRepository.existsByEmailIgnoreCase(user.getEmail())) {
            throw new RuntimeException("User with this email already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(String id, User updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.getEmail() != null && !updates.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(updates.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(updates.getEmail());
        }

        if (updates.getPassword() != null && !updates.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updates.getPassword()));
        }

        if (updates.getFirstName() != null) user.setFirstName(updates.getFirstName());
        if (updates.getLastName() != null) user.setLastName(updates.getLastName());
        if (updates.getRole() != null) user.setRole(updates.getRole());
        if (updates.getDepartment() != null) user.setDepartment(updates.getDepartment());
        if (updates.getLocation() != null) user.setLocation(updates.getLocation());
        if (updates.getManagerId() != null) user.setManagerId(updates.getManagerId());
        if (updates.getHrbpId() != null) user.setHrbpId(updates.getHrbpId());
        if (updates.getIsActive() != null) user.setIsActive(updates.getIsActive());

        return userRepository.save(user);
    }

    @Transactional
    public void initializeDefaultUsers() {
        String defaultPassword = "password123";
        
        // List of default users to ensure exist
        List<DefaultUserInfo> defaultUserInfos = List.of(
            new DefaultUserInfo("admin@pip.com", defaultPassword, "Admin", "User", UserRole.ADMIN),
            new DefaultUserInfo("manager@pip.com", defaultPassword, "Manager", "User", UserRole.MANAGER),
            new DefaultUserInfo("employee@pip.com", defaultPassword, "Employee", "User", UserRole.EMPLOYEE),
            new DefaultUserInfo("hrbp@pip.com", defaultPassword, "HRBP", "User", UserRole.HRBP),
            new DefaultUserInfo("executive@pip.com", defaultPassword, "Executive", "User", UserRole.EXECUTIVE)
        );

        // Create or update each default user
        for (DefaultUserInfo userInfo : defaultUserInfos) {
            Optional<User> existingUser = userRepository.findByEmailIgnoreCase(userInfo.email);
            if (existingUser.isPresent()) {
                // Update existing user with correct password
                User user = existingUser.get();
                user.setPassword(passwordEncoder.encode(userInfo.password));
                user.setFirstName(userInfo.firstName);
                user.setLastName(userInfo.lastName);
                user.setRole(userInfo.role);
                user.setIsActive(true);
                userRepository.save(user);
            } else {
                // Create new user
                User newUser = createUserWithPassword(userInfo.email, userInfo.password, 
                    userInfo.firstName, userInfo.lastName, userInfo.role);
                userRepository.save(newUser);
            }
        }
    }

    private static class DefaultUserInfo {
        String email;
        String password;
        String firstName;
        String lastName;
        UserRole role;

        DefaultUserInfo(String email, String password, String firstName, String lastName, UserRole role) {
            this.email = email;
            this.password = password;
            this.firstName = firstName;
            this.lastName = lastName;
            this.role = role;
        }
    }

    private User createUserWithPassword(String email, String password, String firstName, String lastName, UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(role);
        user.setIsActive(true);
        return user;
    }
}

