package com.pip.repository;

import com.pip.model.ReviewForm;
import com.pip.model.ReviewType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewFormRepository extends JpaRepository<ReviewForm, String> {
    List<ReviewForm> findByCycleId(String cycleId);
    List<ReviewForm> findByCycleIdAndIsActive(String cycleId, Boolean isActive);
    Optional<ReviewForm> findByCycleIdAndReviewType(String cycleId, ReviewType reviewType);
    List<ReviewForm> findByCycleIdAndReviewTypeAndIsActive(String cycleId, ReviewType reviewType, Boolean isActive);
    List<ReviewForm> findByCycleIdAndTargetRole(String cycleId, String targetRole);
}

