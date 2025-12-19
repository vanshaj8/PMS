package com.pip.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pip.model.*;
import com.pip.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RatingService {
    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private AppraisalParticipantRepository participantRepository;

    @Autowired
    private ReviewResponseRepository reviewResponseRepository;

    @Autowired
    private ReviewFormRepository reviewFormRepository;

    @Autowired
    private AppraisalCycleRepository cycleRepository;

    @Autowired
    private CalibrationSessionRepository calibrationSessionRepository;

    @Autowired
    private CalibrationAdjustmentRepository calibrationAdjustmentRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Rating calculateAndSaveRating(String participantId, RatingSource source, String raterId) {
        AppraisalParticipant participant = participantRepository.findById(participantId)
            .orElseThrow(() -> new RuntimeException("Participant not found"));

        // Get review responses for this participant and review type
        ReviewType reviewType = mapRatingSourceToReviewType(source);
        ReviewResponse response = reviewResponseRepository
            .findByParticipantIdAndReviewType(participantId, reviewType)
            .orElseThrow(() -> new RuntimeException("Review response not found"));

        // Get the form to understand structure
        ReviewForm form = reviewFormRepository.findById(response.getFormId())
            .orElseThrow(() -> new RuntimeException("Review form not found"));

        // Parse form sections to get weightages
        Map<String, Object> sections;
        try {
            sections = objectMapper.readValue(form.getSections(), 
                new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Invalid form structure", e);
        }

        // Parse responses
        Map<String, Object> responses;
        try {
            responses = objectMapper.readValue(response.getResponses(),
                new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Invalid response format", e);
        }

        // Calculate weighted rating
        double weightedRating = calculateWeightedRating(sections, responses);

        // Get rating scale from cycle
        AppraisalCycle cycle = cycleRepository.findById(participant.getCycleId())
            .orElseThrow(() -> new RuntimeException("Cycle not found"));

        Map<String, Object> ratingScale;
        try {
            ratingScale = objectMapper.readValue(cycle.getRatingScale(),
                new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Invalid rating scale", e);
        }

        String ratingLabel = getRatingLabel(weightedRating, ratingScale);

        // Create or update rating
        Rating rating = ratingRepository
            .findByParticipantIdAndRatingSource(participantId, source)
            .orElse(new Rating());

        rating.setParticipant(participant);
        rating.setRatingSource(source);
        rating.setRaterId(raterId);
        rating.setRatingValue(weightedRating);
        rating.setRatingLabel(ratingLabel);
        rating.setWeightedRating(weightedRating);
        rating.setIsCalibrated(false);
        rating.setIsFinal(false);

        // Store section-wise ratings
        Map<String, Double> sectionRatings = extractSectionRatings(sections, responses);
        try {
            rating.setSectionRatings(objectMapper.writeValueAsString(sectionRatings));
        } catch (Exception e) {
            throw new RuntimeException("Error storing section ratings", e);
        }

        return ratingRepository.save(rating);
    }

    private double calculateWeightedRating(Map<String, Object> sections, Map<String, Object> responses) {
        double totalRating = 0.0;
        double totalWeight = 0.0;

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sectionsList = (List<Map<String, Object>>) sections.get("sections");
        if (sectionsList == null) return 0.0;

        for (Map<String, Object> section : sectionsList) {
            String sectionId = (String) section.get("id");
            Double sectionWeight = getDoubleValue(section.get("weightage"));
            
            @SuppressWarnings("unchecked")
            Map<String, Object> sectionResponse = (Map<String, Object>) responses.get(sectionId);
            if (sectionResponse == null) continue;

            double sectionRating = calculateSectionRating(section, sectionResponse);
            totalRating += sectionRating * (sectionWeight != null ? sectionWeight : 0.0);
            totalWeight += (sectionWeight != null ? sectionWeight : 0.0);
        }

        return totalWeight > 0 ? totalRating / totalWeight : 0.0;
    }

    private double calculateSectionRating(Map<String, Object> section, Map<String, Object> sectionResponse) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questions = (List<Map<String, Object>>) section.get("questions");
        if (questions == null || questions.isEmpty()) return 0.0;

        double totalRating = 0.0;
        int count = 0;

        for (Map<String, Object> question : questions) {
            String questionId = (String) question.get("id");
            String questionType = (String) question.get("type");

            Object answer = sectionResponse.get(questionId);
            if (answer == null) continue;

            if ("rating".equals(questionType)) {
                Double rating = getDoubleValue(answer);
                if (rating != null) {
                    totalRating += rating;
                    count++;
                }
            }
        }

        return count > 0 ? totalRating / count : 0.0;
    }

    private Map<String, Double> extractSectionRatings(Map<String, Object> sections, Map<String, Object> responses) {
        Map<String, Double> sectionRatings = new HashMap<>();
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sectionsList = (List<Map<String, Object>>) sections.get("sections");
        if (sectionsList == null) return sectionRatings;

        for (Map<String, Object> section : sectionsList) {
            String sectionId = (String) section.get("id");
            @SuppressWarnings("unchecked")
            Map<String, Object> sectionResponse = (Map<String, Object>) responses.get(sectionId);
            if (sectionResponse != null) {
                sectionRatings.put(sectionId, calculateSectionRating(section, sectionResponse));
            }
        }

        return sectionRatings;
    }

    private String getRatingLabel(double rating, Map<String, Object> ratingScale) {
        String scaleType = (String) ratingScale.get("type");
        
        if ("numeric".equals(scaleType)) {
            @SuppressWarnings("unchecked")
            Map<String, String> labels = (Map<String, String>) ratingScale.get("labels");
            if (labels != null) {
                // Find matching label based on rating value
                for (Map.Entry<String, String> entry : labels.entrySet()) {
                    try {
                        double threshold = Double.parseDouble(entry.getKey());
                        if (rating >= threshold) {
                            return entry.getValue();
                        }
                    } catch (NumberFormatException e) {
                        // Skip invalid entries
                    }
                }
            }
        }
        
        return String.valueOf(rating);
    }

    private ReviewType mapRatingSourceToReviewType(RatingSource source) {
        switch (source) {
            case SELF: return ReviewType.SELF_REVIEW;
            case MANAGER: return ReviewType.MANAGER_REVIEW;
            case SKIP_LEVEL: return ReviewType.SKIP_REVIEW;
            case PEER: return ReviewType.PEER_REVIEW;
            case HR: return ReviewType.HR_REVIEW;
            default: throw new RuntimeException("Invalid rating source: " + source);
        }
    }

    private Double getDoubleValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        if (value instanceof String) {
            try {
                return Double.parseDouble((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    @Transactional
    public Rating calibrateRating(String participantId, Double calibratedRating, String justification, String adjustedBy) {
        Rating rating = ratingRepository.findByParticipantIdAndRatingSource(participantId, RatingSource.MANAGER)
            .orElseThrow(() -> new RuntimeException("Rating not found"));

        Double originalRating = rating.getRatingValue();

        rating.setIsCalibrated(true);
        rating.setCalibratedRating(calibratedRating);
        rating.setCalibrationReason(justification);
        rating.setRatingValue(calibratedRating);

        // Update participant's calibrated status
        AppraisalParticipant participant = participantRepository.findById(participantId)
            .orElseThrow(() -> new RuntimeException("Participant not found"));
        participant.setCalibrated(true);
        participant.setCalibratedAt(LocalDateTime.now());
        participantRepository.save(participant);

        return ratingRepository.save(rating);
    }

    public Map<String, Object> calculateDistribution(String cycleId) {
        List<AppraisalParticipant> participants = participantRepository.findByCycleId(cycleId);
        List<Rating> ratings = new ArrayList<>();
        
        for (AppraisalParticipant participant : participants) {
            Rating rating = ratingRepository.findByParticipantIdAndIsFinal(participant.getId(), true)
                .stream()
                .findFirst()
                .orElse(null);
            if (rating != null) {
                ratings.add(rating);
            }
        }

        Map<String, Long> distribution = ratings.stream()
            .collect(Collectors.groupingBy(
                r -> r.getRatingLabel() != null ? r.getRatingLabel() : String.valueOf(r.getRatingValue()),
                Collectors.counting()
            ));

        long total = ratings.size();
        Map<String, Object> result = new HashMap<>();
        result.put("distribution", distribution);
        result.put("total", total);
        
        Map<String, Double> percentages = new HashMap<>();
        for (Map.Entry<String, Long> entry : distribution.entrySet()) {
            percentages.put(entry.getKey(), total > 0 ? (entry.getValue() * 100.0 / total) : 0.0);
        }
        result.put("percentages", percentages);

        return result;
    }
}

