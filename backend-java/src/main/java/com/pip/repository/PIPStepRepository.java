package com.pip.repository;

import com.pip.model.PIPStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PIPStepRepository extends JpaRepository<PIPStep, String> {
    List<PIPStep> findByPipId(String pipId);
}

