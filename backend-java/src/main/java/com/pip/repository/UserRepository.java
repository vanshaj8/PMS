package com.pip.repository;

import com.pip.model.User;
import com.pip.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findByRole(UserRole role);
    List<User> findByRoleAndIsActive(UserRole role, Boolean isActive);
    List<User> findByManagerId(String managerId);
    List<User> findByHrbpId(String hrbpId);
    List<User> findByIsActive(Boolean isActive);
    boolean existsByEmailIgnoreCase(String email);
}

