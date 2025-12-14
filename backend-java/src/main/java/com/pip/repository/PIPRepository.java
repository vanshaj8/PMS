package com.pip.repository;

import com.pip.model.PIP;
import com.pip.model.PIPStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PIPRepository extends JpaRepository<PIP, String> {
    List<PIP> findByEmployeeId(String employeeId);
    List<PIP> findByManagerId(String managerId);
    List<PIP> findByHrbpId(String hrbpId);
    List<PIP> findByStatus(PIPStatus status);
    List<PIP> findByEmployeeIdOrManagerIdOrHrbpId(String employeeId, String managerId, String hrbpId);
}

