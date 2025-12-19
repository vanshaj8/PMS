package com.pip.goals.repository;

import com.pip.goals.model.Goal;
import com.pip.goals.model.GoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GoalRepository extends JpaRepository<Goal, String> {
    List<Goal> findByEmployeeId(String employeeId);
    List<Goal> findByEmployeeIdAndStatus(String employeeId, GoalStatus status);
    List<Goal> findByEmployeeIdAndIsCurrentVersion(String employeeId, Boolean isCurrentVersion);
    Optional<Goal> findByIdAndIsCurrentVersion(String id, Boolean isCurrentVersion);
    List<Goal> findByPreviousVersionId(String previousVersionId);
    List<Goal> findByCreatedInContextAndCreatedInContextId(String context, String contextId);
    List<Goal> findByIsLocked(Boolean isLocked);
}

