package com.pip.goals.repository;

import com.pip.goals.model.GoalVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GoalVersionRepository extends JpaRepository<GoalVersion, String> {
    List<GoalVersion> findByGoalIdOrderByVersionNumberDesc(String goalId);
    Optional<GoalVersion> findByGoalIdAndVersionNumber(String goalId, Integer versionNumber);
}

