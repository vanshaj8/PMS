package com.pip.service;

import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Service for calculating business days
 * Excludes weekends and holidays
 */
@Service
public class BusinessDayService {
    
    // TODO: Load from database or configuration file
    private final Set<LocalDate> holidays = new HashSet<>();
    
    /**
     * Check if a date is a business day (not weekend or holiday)
     */
    public boolean isBusinessDay(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        // Exclude weekends
        if (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) {
            return false;
        }
        // Exclude holidays
        return !holidays.contains(date);
    }
    
    /**
     * Add business days to a date
     * @param startDate Starting date
     * @param businessDays Number of business days to add
     * @return The date after adding business days
     */
    public LocalDate addBusinessDays(LocalDate startDate, int businessDays) {
        if (businessDays == 0) {
            return startDate;
        }
        
        LocalDate result = startDate;
        int daysToAdd = businessDays > 0 ? 1 : -1;
        int remainingDays = Math.abs(businessDays);
        
        while (remainingDays > 0) {
            result = result.plusDays(daysToAdd);
            if (isBusinessDay(result)) {
                remainingDays--;
            }
        }
        
        return result;
    }
    
    /**
     * Add business days to a LocalDateTime
     */
    public LocalDateTime addBusinessDays(LocalDateTime startDateTime, int businessDays) {
        LocalDate startDate = startDateTime.toLocalDate();
        LocalDate endDate = addBusinessDays(startDate, businessDays);
        return endDate.atTime(startDateTime.toLocalTime());
    }
    
    /**
     * Calculate number of business days between two dates
     */
    public int businessDaysBetween(LocalDate startDate, LocalDate endDate) {
        int count = 0;
        LocalDate current = startDate;
        
        while (!current.isAfter(endDate)) {
            if (isBusinessDay(current)) {
                count++;
            }
            current = current.plusDays(1);
        }
        
        return count;
    }
    
    /**
     * Adjust date to next business day if it falls on weekend/holiday
     */
    public LocalDate adjustToNextBusinessDay(LocalDate date) {
        while (!isBusinessDay(date)) {
            date = date.plusDays(1);
        }
        return date;
    }
    
    /**
     * Adjust LocalDateTime to next business day if needed
     */
    public LocalDateTime adjustToNextBusinessDay(LocalDateTime dateTime) {
        LocalDate date = dateTime.toLocalDate();
        LocalDate adjustedDate = adjustToNextBusinessDay(date);
        return adjustedDate.atTime(dateTime.toLocalTime());
    }
    
    /**
     * Add days (business or calendar based on flag)
     */
    public LocalDate addDays(LocalDate startDate, int days, boolean businessDaysOnly) {
        if (businessDaysOnly) {
            return addBusinessDays(startDate, days);
        } else {
            return startDate.plusDays(days);
        }
    }
    
    /**
     * Add days to LocalDateTime (business or calendar based on flag)
     */
    public LocalDateTime addDays(LocalDateTime startDateTime, int days, boolean businessDaysOnly) {
        if (businessDaysOnly) {
            return addBusinessDays(startDateTime, days);
        } else {
            return startDateTime.plusDays(days);
        }
    }
    
    // TODO: Add methods to load holidays from database
    // TODO: Add employee leave integration
}

