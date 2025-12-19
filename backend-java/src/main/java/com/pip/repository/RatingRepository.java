package com.pip.repository;

import com.pip.model.Rating;
import com.pip.model.RatingSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, String> {
    List<Rating> findByParticipantId(String participantId);
    Optional<Rating> findByParticipantIdAndRatingSource(String participantId, RatingSource ratingSource);
    List<Rating> findByParticipantIdAndIsFinal(String participantId, Boolean isFinal);
    List<Rating> findByRaterId(String raterId);
    List<Rating> findByIsCalibrated(Boolean isCalibrated);
    List<Rating> findByParticipantIdAndIsCalibrated(String participantId, Boolean isCalibrated);
}

