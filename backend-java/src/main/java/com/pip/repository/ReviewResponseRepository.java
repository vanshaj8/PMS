package com.pip.repository;

import com.pip.model.ReviewResponse;
import com.pip.model.ReviewType;
import com.pip.model.ResponseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewResponseRepository extends JpaRepository<ReviewResponse, String> {
    List<ReviewResponse> findByParticipantId(String participantId);
    Optional<ReviewResponse> findByParticipantIdAndReviewType(String participantId, ReviewType reviewType);
    List<ReviewResponse> findByParticipantIdAndStatus(String participantId, ResponseStatus status);
    List<ReviewResponse> findByReviewerId(String reviewerId);
    List<ReviewResponse> findByReviewerIdAndReviewType(String reviewerId, ReviewType reviewType);
    List<ReviewResponse> findByFormId(String formId);
    List<ReviewResponse> findByParticipantIdAndFormId(String participantId, String formId);
}

