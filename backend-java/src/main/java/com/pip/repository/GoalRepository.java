package com.pip.repository;

import com.pip.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GoalRepository extends JpaRepository<Goal, String> {
    List<Goal> findByPipId(String pipId);
}

