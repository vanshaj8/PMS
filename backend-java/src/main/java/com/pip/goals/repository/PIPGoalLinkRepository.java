package com.pip.goals.repository;

import com.pip.goals.model.PIPGoalLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PIPGoalLinkRepository extends JpaRepository<PIPGoalLink, String> {
    List<PIPGoalLink> findByPipId(String pipId);
    List<PIPGoalLink> findByPipIdAndIsActive(String pipId, Boolean isActive);
    List<PIPGoalLink> findByGoalId(String goalId);
}

