package com.pip.core.repository;

import com.pip.core.model.UnifiedReview;
import com.pip.core.model.WorkflowContext;
import com.pip.core.model.ReviewType;
import com.pip.core.model.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UnifiedReviewRepository extends JpaRepository<UnifiedReview, String> {
    List<UnifiedReview> findByContextId(String contextId);
    List<UnifiedReview> findByReviewContextAndContextId(WorkflowContext context, String contextId);
    Optional<UnifiedReview> findByReviewContextAndContextIdAndReviewType(WorkflowContext context, String contextId, ReviewType reviewType);
    List<UnifiedReview> findByReviewerId(String reviewerId);
    List<UnifiedReview> findByReviewerIdAndReviewType(String reviewerId, ReviewType reviewType);
    List<UnifiedReview> findByStatus(ReviewStatus status);
}

