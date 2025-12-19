package com.pip.repository;

import com.pip.model.User;
import com.pip.model.UserRole;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.Map;

public class UserSpecification {
    
    public static Specification<User> buildSpecification(Map<String, Object> filters) {
        Specification<User> spec = Specification.where(null);
        
        // User name filter (searches firstName, lastName, email, id)
        if (filters.containsKey("userName") && filters.get("userName") != null) {
            String searchTerm = filters.get("userName").toString().toLowerCase();
            spec = spec.and((root, query, cb) -> {
                Predicate firstNameMatch = cb.like(cb.lower(root.get("firstName")), "%" + searchTerm + "%");
                Predicate lastNameMatch = cb.like(cb.lower(root.get("lastName")), "%" + searchTerm + "%");
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), "%" + searchTerm + "%");
                Predicate idMatch = cb.like(cb.lower(root.get("id")), "%" + searchTerm + "%");
                Predicate preferredNameMatch = cb.like(cb.lower(root.get("preferredName")), "%" + searchTerm + "%");
                return cb.or(firstNameMatch, lastNameMatch, emailMatch, idMatch, preferredNameMatch);
            });
        }
        
        // User ID filter
        if (filters.containsKey("userId") && filters.get("userId") != null) {
            String userId = filters.get("userId").toString();
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("id")), "%" + userId.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("email")), "%" + userId.toLowerCase() + "%")
                )
            );
        }
        
        // Role filter
        if (filters.containsKey("role") && filters.get("role") != null) {
            try {
                UserRole role = UserRole.valueOf(filters.get("role").toString().toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("role"), role));
            } catch (IllegalArgumentException e) {
                // Invalid role, ignore
            }
        }
        
        // Status filter
        if (filters.containsKey("status") && filters.get("status") != null) {
            String status = filters.get("status").toString();
            if ("active".equalsIgnoreCase(status)) {
                spec = spec.and((root, query, cb) -> cb.isTrue(root.get("isActive")));
            } else if ("inactive".equalsIgnoreCase(status)) {
                spec = spec.and((root, query, cb) -> 
                    cb.or(
                        cb.isFalse(root.get("isActive")),
                        cb.isNull(root.get("isActive"))
                    )
                );
            }
        }
        
        // Department filter
        if (filters.containsKey("department") && filters.get("department") != null) {
            String dept = filters.get("department").toString();
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("department")), "%" + dept.toLowerCase() + "%")
            );
        }
        
        // Manager ID filter
        if (filters.containsKey("managerId") && filters.get("managerId") != null) {
            String managerId = filters.get("managerId").toString();
            spec = spec.and((root, query, cb) -> cb.equal(root.get("managerId"), managerId));
        }
        
        // Missing Manager filter
        if (filters.containsKey("missingManager") && Boolean.TRUE.equals(filters.get("missingManager"))) {
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.isNull(root.get("managerId")),
                    cb.equal(root.get("managerId"), "")
                )
            );
        }
        
        // HRBP ID filter
        if (filters.containsKey("hrbpId") && filters.get("hrbpId") != null) {
            String hrbpId = filters.get("hrbpId").toString();
            spec = spec.and((root, query, cb) -> cb.equal(root.get("hrbpId"), hrbpId));
        }
        
        // Missing HRBP filter
        if (filters.containsKey("missingHrbp") && Boolean.TRUE.equals(filters.get("missingHrbp"))) {
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.isNull(root.get("hrbpId")),
                    cb.equal(root.get("hrbpId"), "")
                )
            );
        }
        
        // Job Title filter
        if (filters.containsKey("jobTitle") && filters.get("jobTitle") != null) {
            String jobTitle = filters.get("jobTitle").toString();
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("jobTitle")), "%" + jobTitle.toLowerCase() + "%")
            );
        }
        
        // Business Unit filter
        if (filters.containsKey("businessUnit") && filters.get("businessUnit") != null) {
            String businessUnit = filters.get("businessUnit").toString();
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("businessUnit")), "%" + businessUnit.toLowerCase() + "%")
            );
        }
        
        // Employment Type filter
        if (filters.containsKey("employmentType") && filters.get("employmentType") != null) {
            try {
                com.pip.model.EmploymentType empType = com.pip.model.EmploymentType.valueOf(
                    filters.get("employmentType").toString().toUpperCase()
                );
                spec = spec.and((root, query, cb) -> cb.equal(root.get("employmentType"), empType));
            } catch (IllegalArgumentException e) {
                // Invalid employment type, ignore
            }
        }
        
        return spec;
    }
}

