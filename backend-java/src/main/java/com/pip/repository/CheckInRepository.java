package com.pip.repository;

import com.pip.model.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CheckInRepository extends JpaRepository<CheckIn, String> {
    List<CheckIn> findByPipId(String pipId);
}

