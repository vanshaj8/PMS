package com.pip.repository;

import com.pip.model.CalibrationSession;
import com.pip.model.CalibrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CalibrationSessionRepository extends JpaRepository<CalibrationSession, String> {
    List<CalibrationSession> findByCycleId(String cycleId);
    List<CalibrationSession> findByCycleIdAndStatus(String cycleId, CalibrationStatus status);
    List<CalibrationSession> findByDepartment(String department);
    List<CalibrationSession> findByFacilitatedBy(String facilitatedBy);
}

