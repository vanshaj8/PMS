package com.pip.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pip.model.*;
import com.pip.repository.ReviewFormRepository;
import com.pip.repository.ReviewResponseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ReviewFormService {
    @Autowired
    private ReviewFormRepository formRepository;

    @Autowired
    private ReviewResponseRepository responseRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public ReviewForm createForm(CreateReviewFormRequest request) {
        ReviewForm form = new ReviewForm();
        form.setCycleId(request.getCycleId());
        form.setFormName(request.getFormName());
        form.setReviewType(request.getReviewType());
        form.setTargetRole(request.getTargetRole());
        form.setTargetDepartment(request.getTargetDepartment());
        form.setIsActive(true);
        form.setCreatedBy(request.getCreatedBy());

        // Validate and store sections as JSON
        try {
            String sectionsJson = objectMapper.writeValueAsString(request.getSections());
            form.setSections(sectionsJson);
        } catch (Exception e) {
            throw new RuntimeException("Invalid sections format", e);
        }

        return formRepository.save(form);
    }

    @Transactional
    public ReviewResponse submitResponse(SubmitReviewResponseRequest request) {
        // Check if response already exists
        Optional<ReviewResponse> existing = responseRepository
            .findByParticipantIdAndReviewType(request.getParticipantId(), request.getReviewType());

        ReviewResponse response;
        if (existing.isPresent()) {
            response = existing.get();
            if (response.getIsLocked()) {
                throw new RuntimeException("Response is locked and cannot be modified");
            }
        } else {
            response = new ReviewResponse();
            response.setParticipantId(request.getParticipantId());
            response.setFormId(request.getFormId());
            response.setReviewType(request.getReviewType());
        }

        response.setReviewerId(request.getReviewerId());

        // Store responses as JSON
        try {
            String responsesJson = objectMapper.writeValueAsString(request.getResponses());
            response.setResponses(responsesJson);
        } catch (Exception e) {
            throw new RuntimeException("Invalid responses format", e);
        }

        if (request.getSubmit()) {
            response.setStatus(ResponseStatus.SUBMITTED);
            response.setSubmittedAt(LocalDateTime.now());
        } else {
            response.setStatus(ResponseStatus.DRAFT);
        }

        return responseRepository.save(response);
    }

    public List<ReviewForm> getFormsByCycle(String cycleId) {
        return formRepository.findByCycleIdAndIsActive(cycleId, true);
    }

    public Optional<ReviewForm> getFormForReviewType(String cycleId, ReviewType reviewType) {
        List<ReviewForm> forms = formRepository.findByCycleIdAndReviewTypeAndIsActive(cycleId, reviewType, true);
        return forms.isEmpty() ? Optional.empty() : Optional.of(forms.get(0));
    }

    public List<ReviewResponse> getResponsesByParticipant(String participantId) {
        return responseRepository.findByParticipantId(participantId);
    }

    public Optional<ReviewResponse> getResponse(String participantId, ReviewType reviewType) {
        return responseRepository.findByParticipantIdAndReviewType(participantId, reviewType);
    }

    // DTO classes
    public static class CreateReviewFormRequest {
        private String cycleId;
        private String formName;
        private ReviewType reviewType;
        private String targetRole;
        private String targetDepartment;
        private Map<String, Object> sections;
        private String createdBy;

        // Getters and setters
        public String getCycleId() { return cycleId; }
        public void setCycleId(String cycleId) { this.cycleId = cycleId; }
        public String getFormName() { return formName; }
        public void setFormName(String formName) { this.formName = formName; }
        public ReviewType getReviewType() { return reviewType; }
        public void setReviewType(ReviewType reviewType) { this.reviewType = reviewType; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
        public String getTargetDepartment() { return targetDepartment; }
        public void setTargetDepartment(String targetDepartment) { this.targetDepartment = targetDepartment; }
        public Map<String, Object> getSections() { return sections; }
        public void setSections(Map<String, Object> sections) { this.sections = sections; }
        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    }

    public static class SubmitReviewResponseRequest {
        private String participantId;
        private String formId;
        private ReviewType reviewType;
        private String reviewerId;
        private Map<String, Object> responses;
        private Boolean submit;

        // Getters and setters
        public String getParticipantId() { return participantId; }
        public void setParticipantId(String participantId) { this.participantId = participantId; }
        public String getFormId() { return formId; }
        public void setFormId(String formId) { this.formId = formId; }
        public ReviewType getReviewType() { return reviewType; }
        public void setReviewType(ReviewType reviewType) { this.reviewType = reviewType; }
        public String getReviewerId() { return reviewerId; }
        public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }
        public Map<String, Object> getResponses() { return responses; }
        public void setResponses(Map<String, Object> responses) { this.responses = responses; }
        public Boolean getSubmit() { return submit; }
        public void setSubmit(Boolean submit) { this.submit = submit; }
    }
}

