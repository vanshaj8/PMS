package com.pip.goals.repository;

import com.pip.goals.model.GoalContextLink;
import com.pip.core.model.WorkflowContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GoalContextLinkRepository extends JpaRepository<GoalContextLink, String> {
    List<GoalContextLink> findByGoalId(String goalId);
    List<GoalContextLink> findByContextAndContextId(WorkflowContext context, String contextId);
    List<GoalContextLink> findByContextAndContextIdAndIsSnapshot(WorkflowContext context, String contextId, Boolean isSnapshot);
}

