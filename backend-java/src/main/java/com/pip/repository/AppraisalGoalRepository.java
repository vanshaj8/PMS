package com.pip.repository;

import com.pip.model.AppraisalGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AppraisalGoalRepository extends JpaRepository<AppraisalGoal, String> {
    List<AppraisalGoal> findByParticipantId(String participantId);
    List<AppraisalGoal> findByParticipantIdAndStatus(String participantId, com.pip.model.AppraisalGoalStatus status);
}

