package com.pip.repository;

import com.pip.model.AppraisalCycle;
import com.pip.model.AppraisalCycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppraisalCycleRepository extends JpaRepository<AppraisalCycle, String> {
    List<AppraisalCycle> findByStatus(AppraisalCycleStatus status);
    Optional<AppraisalCycle> findByCycleNameIgnoreCase(String cycleName);
    List<AppraisalCycle> findByCreatedBy(String createdBy);
    List<AppraisalCycle> findByStatusOrderByStartDateDesc(AppraisalCycleStatus status);
}

