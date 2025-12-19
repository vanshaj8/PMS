package com.pip.repository;

import com.pip.model.AppraisalOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppraisalOutcomeRepository extends JpaRepository<AppraisalOutcome, String> {
    Optional<AppraisalOutcome> findByParticipantId(String participantId);
    List<AppraisalOutcome> findByReleasedToEmployee(Boolean releasedToEmployee);
    List<AppraisalOutcome> findByApprovedBy(String approvedBy);
    List<AppraisalOutcome> findByPipTriggered(Boolean pipTriggered);
}

