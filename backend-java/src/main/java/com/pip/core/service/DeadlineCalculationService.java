package com.pip.core.service;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Shared deadline calculation service
 * Used by both PIP and Appraisal modules
 */
@Service
public class DeadlineCalculationService {
    
    /**
     * Calculate due date from start date and duration
     */
    public LocalDate calculateDueDate(LocalDate startDate, Integer durationDays) {
        if (startDate == null || durationDays == null) {
            return null;
        }
        return startDate.plusDays(durationDays);
    }

    /**
     * Calculate due date from start datetime and duration
     */
    public LocalDateTime calculateDueDateTime(LocalDateTime startDateTime, Integer durationDays) {
        if (startDateTime == null || durationDays == null) {
            return null;
        }
        return startDateTime.plusDays(durationDays);
    }

    /**
     * Check if date is overdue
     */
    public boolean isOverdue(LocalDate dueDate) {
        if (dueDate == null) {
            return false;
        }
        return dueDate.isBefore(LocalDate.now());
    }

    /**
     * Check if date is due soon (within buffer days)
     */
    public boolean isDueSoon(LocalDate dueDate, Integer bufferDays) {
        if (dueDate == null || bufferDays == null) {
            return false;
        }
        LocalDate today = LocalDate.now();
        LocalDate bufferDate = dueDate.minusDays(bufferDays);
        return !today.isBefore(bufferDate) && !today.isAfter(dueDate);
    }
}

