package com.pip.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Utility class for consistent UTC timezone handling
 * Rule: Store everything in UTC, render in user timezone
 */
public class DateTimeUtil {
    
    // UTC formatter for storage (ISO 8601 with Z suffix)
    public static final DateTimeFormatter UTC_FORMATTER = DateTimeFormatter.ISO_INSTANT;
    
    // Formatter for display (can be customized per user timezone)
    public static final DateTimeFormatter DISPLAY_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    
    /**
     * Get current time in UTC
     */
    public static Instant nowUTC() {
        return Instant.now();
    }
    
    /**
     * Convert LocalDateTime to UTC Instant
     * Assumes LocalDateTime is in system default timezone, converts to UTC
     */
    public static Instant toUTC(LocalDateTime localDateTime) {
        if (localDateTime == null) {
            return null;
        }
        return localDateTime.atZone(ZoneId.systemDefault()).withZoneSameInstant(ZoneOffset.UTC).toInstant();
    }
    
    /**
     * Convert UTC Instant to LocalDateTime in system default timezone
     */
    public static LocalDateTime fromUTC(Instant instant) {
        if (instant == null) {
            return null;
        }
        return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
    }
    
    /**
     * Format Instant to UTC string (for storage/API)
     * Format: 2025-12-19T01:21:05.541Z
     */
    public static String formatUTC(Instant instant) {
        if (instant == null) {
            return null;
        }
        return instant.toString(); // ISO-8601 format with Z
    }
    
    /**
     * Parse UTC string to Instant
     * Handles both:
     * - ISO_INSTANT format: 2025-12-19T01:21:05.541Z
     * - ISO_LOCAL_DATE_TIME format: 2025-12-19T01:21:05.541 (assumes UTC)
     * - Date-only format: 2025-12-19 (assumes 23:59:59 UTC)
     */
    public static Instant parseUTC(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        
        try {
            // Try ISO_INSTANT format first (with Z)
            if (dateStr.endsWith("Z") || dateStr.contains("+") || dateStr.contains("-") && dateStr.length() > 19) {
                return Instant.parse(dateStr);
            }
            
            // Try date-only format (YYYY-MM-DD)
            if (dateStr.length() == 10) {
                LocalDateTime localDateTime = LocalDateTime.parse(dateStr + "T23:59:59");
                return toUTC(localDateTime);
            }
            
            // Try ISO_LOCAL_DATE_TIME (assume UTC)
            LocalDateTime localDateTime = LocalDateTime.parse(dateStr);
            return toUTC(localDateTime);
            
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date format: " + dateStr, e);
        }
    }
    
    /**
     * Format deadline with time (23:59:59 UTC) for end-of-day deadlines
     */
    public static String formatDeadlineUTC(Instant instant) {
        if (instant == null) {
            return null;
        }
        // Ensure deadline is at end of day in UTC
        Instant endOfDay = instant.atZone(ZoneOffset.UTC)
            .toLocalDate()
            .atTime(23, 59, 59)
            .toInstant(ZoneOffset.UTC);
        return formatUTC(endOfDay);
    }
    
    /**
     * Format for display in user timezone
     */
    public static String formatForDisplay(Instant instant, ZoneId userTimezone) {
        if (instant == null) {
            return null;
        }
        return instant.atZone(userTimezone).format(DISPLAY_FORMATTER);
    }
    
    /**
     * Format for display in UTC (default)
     */
    public static String formatForDisplay(Instant instant) {
        return formatForDisplay(instant, ZoneOffset.UTC);
    }
}

