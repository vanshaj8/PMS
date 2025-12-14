# Repository Layer Examples

## Overview

This document provides examples of Spring Data JPA repositories for the PIP Management System.

## Base Repository Interfaces

### UserRepository

```java
package com.pip.repository;

import com.pip.model.User;
import com.pip.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    // Find by email (case-insensitive)
    Optional<User> findByEmailIgnoreCase(String email);
    
    // Check if email exists (case-insensitive)
    boolean existsByEmailIgnoreCase(String email);
    
    // Find by role
    List<User> findByRole(UserRole role);
    
    // Find active users by role
    List<User> findByRoleAndIsActive(UserRole role, Boolean isActive);
    
    // Find users by manager
    List<User> findByManagerId(String managerId);
    
    // Find users by HRBP
    List<User> findByHrbpId(String hrbpId);
    
    // Find active employees under a manager
    @Query("SELECT u FROM User u WHERE u.managerId = :managerId AND u.role = 'EMPLOYEE' AND u.isActive = true")
    List<User> findActiveEmployeesByManager(@Param("managerId") String managerId);
    
    // Search users by name or email
    @Query("SELECT u FROM User u WHERE " +
           "(LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "u.isActive = true")
    List<User> searchUsers(@Param("search") String search);
}
```

### PIPRepository

```java
package com.pip.repository;

import com.pip.model.PIP;
import com.pip.model.PIPStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PIPRepository extends JpaRepository<PIP, String> {
    
    // Find PIPs by employee
    List<PIP> findByEmployeeId(String employeeId);
    
    // Find PIPs by manager
    List<PIP> findByManagerId(String managerId);
    
    // Find PIPs by HRBP
    List<PIP> findByHrbpId(String hrbpId);
    
    // Find PIPs by status
    List<PIP> findByStatus(PIPStatus status);
    
    // Find active PIPs for an employee
    List<PIP> findByEmployeeIdAndStatus(String employeeId, PIPStatus status);
    
    // Find PIPs with approaching deadlines
    @Query("SELECT p FROM PIP p WHERE " +
           "p.employeeAcknowledgementDeadline BETWEEN :startDate AND :endDate OR " +
           "p.employeeSelfReviewDeadline BETWEEN :startDate AND :endDate OR " +
           "p.managerFinalReviewDeadline BETWEEN :startDate AND :endDate OR " +
           "p.hrbpFinalDecisionDeadline BETWEEN :startDate AND :endDate")
    List<PIP> findPIPsWithApproachingDeadlines(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Find overdue PIPs
    @Query("SELECT p FROM PIP p WHERE " +
           "(p.status = 'PENDING_EMPLOYEE_ACKNOWLEDGEMENT' AND p.employeeAcknowledgementDeadline < :today) OR " +
           "(p.status = 'ACTIVE' AND p.employeeSelfReviewDeadline < :today) OR " +
           "(p.status = 'PENDING_MANAGER_REVIEW' AND p.managerFinalReviewDeadline < :today) OR " +
           "(p.status = 'PENDING_HRBP_DECISION' AND p.hrbpFinalDecisionDeadline < :today)")
    List<PIP> findOverduePIPs(@Param("today") LocalDate today);
    
    // Count PIPs by status for a manager
    @Query("SELECT p.status, COUNT(p) FROM PIP p WHERE p.managerId = :managerId GROUP BY p.status")
    List<Object[]> countPIPsByStatusForManager(@Param("managerId") String managerId);
    
    // Find PIPs requiring action by user
    @Query("SELECT p FROM PIP p WHERE " +
           "(p.employeeId = :userId AND p.status = 'PENDING_EMPLOYEE_ACKNOWLEDGEMENT') OR " +
           "(p.employeeId = :userId AND p.status = 'ACTIVE' AND p.employeeSelfReviewDeadline <= :deadline) OR " +
           "(p.managerId = :userId AND p.status = 'PENDING_MANAGER_REVIEW') OR " +
           "(p.hrbpId = :userId AND p.status = 'PENDING_HRBP_REVIEW') OR " +
           "(p.hrbpId = :userId AND p.status = 'PENDING_HRBP_DECISION')")
    List<PIP> findPIPsRequiringAction(@Param("userId") String userId, @Param("deadline") LocalDate deadline);
}
```

### GoalRepository

```java
package com.pip.repository;

import com.pip.model.Goal;
import com.pip.model.GoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalRepository extends JpaRepository<Goal, String> {
    
    // Find goals by PIP
    List<Goal> findByPipId(String pipId);
    
    // Find goals by status
    List<Goal> findByStatus(GoalStatus status);
    
    // Find goals by PIP and status
    List<Goal> findByPipIdAndStatus(String pipId, GoalStatus status);
    
    // Calculate total weightage for a PIP
    @Query("SELECT COALESCE(SUM(g.weightage), 0) FROM Goal g WHERE g.pipId = :pipId")
    Double calculateTotalWeightage(@Param("pipId") String pipId);
    
    // Find goals with approaching deadlines
    @Query("SELECT g FROM Goal g WHERE g.deadline BETWEEN :startDate AND :endDate")
    List<Goal> findGoalsWithApproachingDeadlines(
        @Param("startDate") java.time.LocalDate startDate,
        @Param("endDate") java.time.LocalDate endDate
    );
}
```

### PIPStepRepository

```java
package com.pip.repository;

import com.pip.model.PIPStep;
import com.pip.model.StepName;
import com.pip.model.StepStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PIPStepRepository extends JpaRepository<PIPStep, String> {
    
    // Find steps by PIP
    List<PIPStep> findByPipId(String pipId);
    
    // Find step by PIP and step name
    Optional<PIPStep> findByPipIdAndStep(String pipId, StepName step);
    
    // Find steps by status
    List<PIPStep> findByStatus(StepStatus status);
    
    // Find overdue steps
    @Query("SELECT s FROM PIPStep s WHERE s.dueDate < :today AND s.status != 'COMPLETED'")
    List<PIPStep> findOverdueSteps(@Param("today") LocalDate today);
    
    // Find steps due soon (within next 7 days)
    @Query("SELECT s FROM PIPStep s WHERE " +
           "s.dueDate BETWEEN :today AND :futureDate AND s.status != 'COMPLETED'")
    List<PIPStep> findStepsDueSoon(
        @Param("today") LocalDate today,
        @Param("futureDate") LocalDate futureDate
    );
}
```

### CheckInRepository

```java
package com.pip.repository;

import com.pip.model.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CheckInRepository extends JpaRepository<CheckIn, String> {
    
    // Find check-ins by PIP
    List<CheckIn> findByPipId(String pipId);
    
    // Find check-ins by date range
    @Query("SELECT c FROM CheckIn c WHERE c.pipId = :pipId AND c.date BETWEEN :startDate AND :endDate ORDER BY c.date DESC")
    List<CheckIn> findCheckInsByDateRange(
        @Param("pipId") String pipId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Find latest check-in for a PIP
    @Query("SELECT c FROM CheckIn c WHERE c.pipId = :pipId ORDER BY c.date DESC, c.createdAt DESC LIMIT 1")
    CheckIn findLatestCheckIn(@Param("pipId") String pipId);
}
```

### NotificationRepository

```java
package com.pip.repository;

import com.pip.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    
    // Find notifications by user
    List<Notification> findByUserId(String userId);
    
    // Find unread notifications
    List<Notification> findByUserIdAndReadFalse(String userId);
    
    // Count unread notifications
    long countByUserIdAndReadFalse(String userId);
    
    // Mark all as read
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.userId = :userId AND n.read = false")
    int markAllAsRead(@Param("userId") String userId);
    
    // Find recent notifications
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId ORDER BY n.createdAt DESC")
    List<Notification> findRecentNotifications(@Param("userId") String userId);
}
```

### AuditLogRepository

```java
package com.pip.repository;

import com.pip.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    // Find logs by entity
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, String entityId);
    
    // Find logs by user
    List<AuditLog> findByUserId(String userId);
    
    // Find logs by action
    List<AuditLog> findByAction(String action);
    
    // Find logs in date range
    @Query("SELECT a FROM AuditLog a WHERE a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    List<AuditLog> findLogsByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    // Find logs for a PIP
    @Query("SELECT a FROM AuditLog a WHERE a.entityType = 'PIP' AND a.entityId = :pipId ORDER BY a.createdAt DESC")
    List<AuditLog> findPIPAuditLogs(@Param("pipId") String pipId);
}
```

## Custom Query Examples

### Native SQL Query Example

```java
@Query(value = "SELECT COUNT(*) FROM pips WHERE manager_id = :managerId AND status = :status", 
       nativeQuery = true)
long countPIPsByManagerAndStatus(@Param("managerId") String managerId, 
                                   @Param("status") String status);
```

### Complex Join Query

```java
@Query("SELECT p, u.firstName, u.lastName FROM PIP p " +
       "JOIN User u ON p.employeeId = u.id " +
       "WHERE p.managerId = :managerId AND p.status = :status")
List<Object[]> findPIPsWithEmployeeNames(@Param("managerId") String managerId, 
                                          @Param("status") PIPStatus status);
```

### Aggregation Query

```java
@Query("SELECT p.status, COUNT(p), AVG(DATEDIFF(p.updatedAt, p.createdAt)) " +
       "FROM PIP p " +
       "WHERE p.createdAt >= :startDate " +
       "GROUP BY p.status")
List<Object[]> getPIPStatistics(@Param("startDate") LocalDateTime startDate);
```

## Transaction Management

### Service Layer with @Transactional

```java
@Service
@Transactional
public class PIPService {
    
    @Autowired
    private PIPRepository pipRepository;
    
    @Autowired
    private GoalRepository goalRepository;
    
    public PIP createPIP(CreatePIPRequest request) {
        // All operations in this method are in a single transaction
        PIP pip = new PIP();
        // ... set properties
        pip = pipRepository.save(pip);
        
        for (Goal goal : request.getGoals()) {
            goal.setPipId(pip.getId());
            goalRepository.save(goal);
        }
        
        return pip;
    }
    
    @Transactional(readOnly = true)
    public List<PIP> getAllPIPs() {
        // Read-only transaction for better performance
        return pipRepository.findAll();
    }
}
```

## Pagination and Sorting

```java
// In Repository
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

Page<PIP> findByManagerId(String managerId, Pageable pageable);

// In Service
public Page<PIP> getPIPsByManager(String managerId, int page, int size, String sortBy) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
    return pipRepository.findByManagerId(managerId, pageable);
}
```
