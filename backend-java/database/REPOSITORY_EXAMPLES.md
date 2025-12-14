# Repository Layer Examples

This document provides examples of Spring Data JPA repositories for the PIP Management System.

---

## Base Repository Interface

All repositories extend `JpaRepository` which provides:
- `save()` - Save entity
- `findById()` - Find by ID
- `findAll()` - Find all
- `delete()` - Delete entity
- `count()` - Count entities
- And more...

---

## UserRepository Example

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
    
    // Find active users
    List<User> findByIsActiveTrue();
    
    // Find users by department
    List<User> findByDepartment(String department);
    
    // Custom query: Find managers with active PIPs
    @Query("SELECT DISTINCT u FROM User u " +
           "JOIN PIP p ON p.managerId = u.id " +
           "WHERE u.role = :role AND p.status = :status")
    List<User> findManagersWithActivePIPs(
        @Param("role") UserRole role,
        @Param("status") String status
    );
    
    // Native query: Count users by role
    @Query(value = "SELECT role, COUNT(*) as count FROM users GROUP BY role", 
           nativeQuery = true)
    List<Object[]> countUsersByRole();
    
    // Find users by multiple criteria
    @Query("SELECT u FROM User u WHERE " +
           "(:department IS NULL OR u.department = :department) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:isActive IS NULL OR u.isActive = :isActive)")
    List<User> findUsersByCriteria(
        @Param("department") String department,
        @Param("role") UserRole role,
        @Param("isActive") Boolean isActive
    );
}
```

---

## PIPRepository Example

```java
package com.pip.repository;

import com.pip.model.PIP;
import com.pip.model.PIPStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PIPRepository extends JpaRepository<PIP, String> {
    
    // Find by employee
    List<PIP> findByEmployeeId(String employeeId);
    
    // Find by manager
    List<PIP> findByManagerId(String managerId);
    
    // Find by HRBP
    List<PIP> findByHrbpId(String hrbpId);
    
    // Find by status
    List<PIP> findByStatus(PIPStatus status);
    
    // Find active PIPs for employee
    List<PIP> findByEmployeeIdAndStatus(String employeeId, PIPStatus status);
    
    // Find overdue PIPs
    @Query("SELECT p FROM PIP p WHERE " +
           "p.status IN :statuses AND " +
           "(p.employeeSelfReviewDeadline < CURRENT_DATE OR " +
           "p.managerFinalReviewDeadline < CURRENT_DATE OR " +
           "p.hrbpFinalDecisionDeadline < CURRENT_DATE)")
    List<PIP> findOverduePIPs(@Param("statuses") List<PIPStatus> statuses);
    
    // Find PIPs requiring action
    @Query("SELECT p FROM PIP p WHERE " +
           "((p.employeeId = :userId AND p.status = 'PENDING_EMPLOYEE_ACKNOWLEDGEMENT') OR " +
           "(p.managerId = :userId AND p.status = 'PENDING_MANAGER_REVIEW') OR " +
           "(p.hrbpId = :userId AND p.status IN ('PENDING_HRBP_REVIEW', 'PENDING_HRBP_DECISION')))")
    List<PIP> findPIPsRequiringAction(@Param("userId") String userId);
    
    // Count PIPs by status
    long countByStatus(PIPStatus status);
    
    // Find completed PIPs with successful outcome
    List<PIP> findByStatusAndFinalOutcome(
        PIPStatus status, 
        String finalOutcome
    );
    
    // Find PIPs created in date range
    @Query("SELECT p FROM PIP p WHERE p.createdAt BETWEEN :startDate AND :endDate")
    List<PIP> findPIPsByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    // Native query: Get PIP statistics by manager
    @Query(value = 
        "SELECT " +
        "  u.id, " +
        "  u.first_name, " +
        "  u.last_name, " +
        "  COUNT(p.id) as total_pips, " +
        "  SUM(CASE WHEN p.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_pips, " +
        "  SUM(CASE WHEN p.final_outcome = 'SUCCESSFUL' THEN 1 ELSE 0 END) as successful_pips " +
        "FROM users u " +
        "LEFT JOIN pips p ON u.id = p.manager_id " +
        "WHERE u.role = 'MANAGER' " +
        "GROUP BY u.id, u.first_name, u.last_name",
        nativeQuery = true)
    List<Object[]> getPIPStatisticsByManager();
}
```

---

## GoalRepository Example

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
    
    // Find all goals for a PIP
    List<Goal> findByPipId(String pipId);
    
    // Find goals by status
    List<Goal> findByStatus(GoalStatus status);
    
    // Find goals for PIP by status
    List<Goal> findByPipIdAndStatus(String pipId, GoalStatus status);
    
    // Calculate total weightage for a PIP
    @Query("SELECT COALESCE(SUM(g.weightage), 0) FROM Goal g WHERE g.pipId = :pipId")
    Double getTotalWeightageByPipId(@Param("pipId") String pipId);
    
    // Find achieved goals
    @Query("SELECT g FROM Goal g WHERE g.pipId = :pipId AND g.status = 'ACHIEVED'")
    List<Goal> findAchievedGoals(@Param("pipId") String pipId);
    
    // Count goals by status for a PIP
    @Query("SELECT g.status, COUNT(g) FROM Goal g WHERE g.pipId = :pipId GROUP BY g.status")
    List<Object[]> countGoalsByStatus(@Param("pipId") String pipId);
}
```

---

## PIPStepRepository Example

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
    
    // Find all steps for a PIP
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
           "s.dueDate BETWEEN :today AND :nextWeek AND s.status != 'COMPLETED'")
    List<PIPStep> findStepsDueSoon(
        @Param("today") LocalDate today,
        @Param("nextWeek") LocalDate nextWeek
    );
    
    // Find completed steps for a PIP
    List<PIPStep> findByPipIdAndStatus(String pipId, StepStatus status);
    
    // Find steps signed by a user
    List<PIPStep> findBySignedBy(String userId);
}
```

---

## CheckInRepository Example

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
    
    // Find all check-ins for a PIP
    List<CheckIn> findByPipId(String pipId);
    
    // Find check-ins by date range
    @Query("SELECT c FROM CheckIn c WHERE c.pipId = :pipId AND " +
           "c.date BETWEEN :startDate AND :endDate ORDER BY c.date DESC")
    List<CheckIn> findCheckInsByDateRange(
        @Param("pipId") String pipId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    // Find recent check-ins
    @Query("SELECT c FROM CheckIn c WHERE c.pipId = :pipId " +
           "ORDER BY c.createdAt DESC")
    List<CheckIn> findRecentCheckIns(@Param("pipId") String pipId, 
                                      org.springframework.data.domain.Pageable pageable);
    
    // Count check-ins for a PIP
    long countByPipId(String pipId);
}
```

---

## Custom Repository Implementation

For complex queries, you can create a custom repository:

### 1. Define Custom Interface

```java
package com.pip.repository;

import com.pip.model.PIP;
import java.util.List;

public interface PIPRepositoryCustom {
    List<PIP> findPIPsWithComplexCriteria(String userId, String role, 
                                          List<String> statuses);
    List<Object[]> getDashboardStatistics(String userId, String role);
}
```

### 2. Implement Custom Repository

```java
package com.pip.repository;

import com.pip.model.PIP;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PIPRepositoryImpl implements PIPRepositoryCustom {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Override
    public List<PIP> findPIPsWithComplexCriteria(String userId, String role, 
                                                 List<String> statuses) {
        String jpql = "SELECT p FROM PIP p WHERE ";
        
        if ("EMPLOYEE".equals(role)) {
            jpql += "p.employeeId = :userId";
        } else if ("MANAGER".equals(role)) {
            jpql += "p.managerId = :userId";
        } else if ("HRBP".equals(role)) {
            jpql += "p.hrbpId = :userId";
        }
        
        if (statuses != null && !statuses.isEmpty()) {
            jpql += " AND p.status IN :statuses";
        }
        
        Query query = entityManager.createQuery(jpql);
        query.setParameter("userId", userId);
        
        if (statuses != null && !statuses.isEmpty()) {
            query.setParameter("statuses", statuses);
        }
        
        return query.getResultList();
    }
    
    @Override
    public List<Object[]> getDashboardStatistics(String userId, String role) {
        String sql = 
            "SELECT " +
            "  COUNT(*) as total, " +
            "  SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active, " +
            "  SUM(CASE WHEN status IN ('PENDING_EMPLOYEE_ACKNOWLEDGEMENT', " +
            "                           'PENDING_MANAGER_REVIEW', " +
            "                           'PENDING_HRBP_DECISION') THEN 1 ELSE 0 END) as pending " +
            "FROM pips " +
            "WHERE ";
        
        if ("EMPLOYEE".equals(role)) {
            sql += "employee_id = ?";
        } else if ("MANAGER".equals(role)) {
            sql += "manager_id = ?";
        } else if ("HRBP".equals(role)) {
            sql += "hrbp_id = ?";
        }
        
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter(1, userId);
        
        return query.getResultList();
    }
}
```

### 3. Extend Base Repository

```java
public interface PIPRepository extends JpaRepository<PIP, String>, PIPRepositoryCustom {
    // ... other methods
}
```

---

## Transaction Management

Spring Data JPA repositories are transactional by default. For custom methods:

```java
@Repository
public class PIPRepositoryImpl implements PIPRepositoryCustom {
    
    @Autowired
    private EntityManager entityManager;
    
    @Transactional
    public void bulkUpdateStatus(List<String> pipIds, PIPStatus newStatus) {
        String jpql = "UPDATE PIP p SET p.status = :status WHERE p.id IN :ids";
        entityManager.createQuery(jpql)
            .setParameter("status", newStatus)
            .setParameter("ids", pipIds)
            .executeUpdate();
    }
}
```

---

## Pagination and Sorting

```java
// In repository
Page<PIP> findByManagerId(String managerId, Pageable pageable);

// In service
Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());
Page<PIP> pips = pipRepository.findByManagerId(managerId, pageable);
```

---

## Best Practices

1. **Use Optional for single results**
   ```java
   Optional<User> findByEmail(String email);
   ```

2. **Use List for multiple results**
   ```java
   List<PIP> findByStatus(PIPStatus status);
   ```

3. **Use @Query for complex queries**
   - Prefer JPQL over native SQL when possible
   - Use native SQL only when necessary

4. **Use @Modifying for update/delete**
   ```java
   @Modifying
   @Query("UPDATE User u SET u.isActive = false WHERE u.id = :id")
   void deactivateUser(@Param("id") String id);
   ```

5. **Handle transactions properly**
   - Use @Transactional for write operations
   - Let Spring handle read operations

6. **Use projections for performance**
   ```java
   @Query("SELECT u.id, u.email, u.firstName FROM User u")
   List<UserProjection> findAllProjections();
   ```

---

## Testing Repositories

```java
@SpringBootTest
@Transactional
class UserRepositoryTest {
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void testFindByEmail() {
        User user = new User();
        user.setEmail("test@example.com");
        userRepository.save(user);
        
        Optional<User> found = userRepository.findByEmailIgnoreCase("TEST@EXAMPLE.COM");
        assertTrue(found.isPresent());
        assertEquals("test@example.com", found.get().getEmail());
    }
}
```

---

*Last Updated: 2024*
