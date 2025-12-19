package com.pip.repository;

import com.pip.model.ReviewPhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewPhaseRepository extends JpaRepository<ReviewPhase, String> {
    List<ReviewPhase> findByCycleId(String cycleId);
    List<ReviewPhase> findByCycleIdOrderBySequenceOrderAsc(String cycleId);
    ReviewPhase findByCycleIdAndPhaseType(String cycleId, com.pip.model.PhaseType phaseType);
}

