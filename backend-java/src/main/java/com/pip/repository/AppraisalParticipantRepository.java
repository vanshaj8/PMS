package com.pip.repository;

import com.pip.model.AppraisalParticipant;
import com.pip.model.ParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppraisalParticipantRepository extends JpaRepository<AppraisalParticipant, String> {
    List<AppraisalParticipant> findByCycleId(String cycleId);
    Optional<AppraisalParticipant> findByCycleIdAndEmployeeId(String cycleId, String employeeId);
    List<AppraisalParticipant> findByEmployeeId(String employeeId);
    List<AppraisalParticipant> findByManagerId(String managerId);
    List<AppraisalParticipant> findBySkipLevelManagerId(String skipLevelManagerId);
    List<AppraisalParticipant> findByHrbpId(String hrbpId);
    List<AppraisalParticipant> findByCycleIdAndStatus(String cycleId, ParticipantStatus status);
    List<AppraisalParticipant> findByManagerIdAndCycleId(String managerId, String cycleId);
    long countByCycleIdAndStatus(String cycleId, ParticipantStatus status);
}

