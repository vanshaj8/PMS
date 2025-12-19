package com.pip.core.repository;

import com.pip.core.model.SharedGoal;
import com.pip.core.model.GoalStatus;
import com.pip.core.model.WorkflowContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SharedGoalRepository extends JpaRepository<SharedGoal, String> {
    List<SharedGoal> findByEmployeeId(String employeeId);
    List<SharedGoal> findByEmployeeIdAndStatus(String employeeId, GoalStatus status);
    List<SharedGoal> findBySourceContextAndSourceId(WorkflowContext context, String sourceId);
    Optional<SharedGoal> findByParentGoalId(String parentGoalId);
    List<SharedGoal> findBySourceContext(WorkflowContext context);
}

