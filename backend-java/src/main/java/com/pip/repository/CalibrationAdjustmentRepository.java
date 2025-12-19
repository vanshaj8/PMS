package com.pip.repository;

import com.pip.model.CalibrationAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CalibrationAdjustmentRepository extends JpaRepository<CalibrationAdjustment, String> {
    List<CalibrationAdjustment> findBySessionId(String sessionId);
    List<CalibrationAdjustment> findByParticipantId(String participantId);
}

