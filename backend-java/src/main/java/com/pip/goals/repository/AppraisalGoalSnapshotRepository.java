package com.pip.goals.repository;

import com.pip.goals.model.AppraisalGoalSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AppraisalGoalSnapshotRepository extends JpaRepository<AppraisalGoalSnapshot, String> {
    List<AppraisalGoalSnapshot> findByAppraisalCycleId(String cycleId);
    List<AppraisalGoalSnapshot> findByParticipantId(String participantId);
    List<AppraisalGoalSnapshot> findByGoalId(String goalId);
}

