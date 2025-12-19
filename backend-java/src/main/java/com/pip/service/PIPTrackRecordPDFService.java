package com.pip.service;

import com.pip.model.*;
import com.pip.repository.UserRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PIPTrackRecordPDFService {

    @Autowired
    private UserRepository userRepository;

    private static final float MARGIN = 50f;
    private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    private static final float CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm");

    public byte[] generateTrackRecordPDF(PIP pip) throws IOException {
        PDDocument document = new PDDocument();
        PDPage currentPage = new PDPage(PDRectangle.A4);
        document.addPage(currentPage);
        PDPageContentStream contentStream = new PDPageContentStream(document, currentPage);

        try {
            float yPosition = PAGE_HEIGHT - MARGIN;

            // Fetch user data
            User employee = userRepository.findById(pip.getEmployeeId()).orElse(null);
            User manager = pip.getManagerId() != null ? userRepository.findById(pip.getManagerId()).orElse(null) : null;
            User hrbp = pip.getHrbpId() != null ? userRepository.findById(pip.getHrbpId()).orElse(null) : null;

            // Header
            yPosition = drawHeader(contentStream, pip, employee, manager, hrbp, yPosition);

            // Executive Summary
            yPosition = drawExecutiveSummary(contentStream, pip, yPosition);
            if (yPosition < 100) {
                contentStream.close();
                currentPage = newPage(document);
                contentStream = new PDPageContentStream(document, currentPage);
                yPosition = PAGE_HEIGHT - MARGIN;
            }

            // Workflow Timeline
            yPosition = drawWorkflowTimeline(contentStream, pip, yPosition);
            if (yPosition < 100) {
                contentStream.close();
                currentPage = newPage(document);
                contentStream = new PDPageContentStream(document, currentPage);
                yPosition = PAGE_HEIGHT - MARGIN;
            }

            // Goals Section
            yPosition = drawGoalsSection(contentStream, pip, yPosition);
            if (yPosition < 100) {
                contentStream.close();
                currentPage = newPage(document);
                contentStream = new PDPageContentStream(document, currentPage);
                yPosition = PAGE_HEIGHT - MARGIN;
            }

            // Check-in History
            yPosition = drawCheckInHistory(contentStream, pip, yPosition);
            if (yPosition < 100) {
                contentStream.close();
                currentPage = newPage(document);
                contentStream = new PDPageContentStream(document, currentPage);
                yPosition = PAGE_HEIGHT - MARGIN;
            }

            // Performance Metrics
            yPosition = drawPerformanceMetrics(contentStream, pip, yPosition);
            if (yPosition < 100) {
                contentStream.close();
                currentPage = newPage(document);
                contentStream = new PDPageContentStream(document, currentPage);
                yPosition = PAGE_HEIGHT - MARGIN;
            }

            // Review Summaries
            yPosition = drawReviewSummaries(contentStream, pip, yPosition);
            if (yPosition < 100) {
                contentStream.close();
                currentPage = newPage(document);
                contentStream = new PDPageContentStream(document, currentPage);
                yPosition = PAGE_HEIGHT - MARGIN;
            }

            // Extension History
            if (pip.getExtensionCount() != null && pip.getExtensionCount() > 0) {
                yPosition = drawExtensionHistory(contentStream, pip, yPosition);
                if (yPosition < 100) {
                    contentStream.close();
                    currentPage = newPage(document);
                    contentStream = new PDPageContentStream(document, currentPage);
                    yPosition = PAGE_HEIGHT - MARGIN;
                }
            }

            // Footer
            drawFooter(contentStream, currentPage, document.getNumberOfPages());
        } finally {
            contentStream.close();
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.save(baos);
        document.close();
        return baos.toByteArray();
    }

    private PDPage newPage(PDDocument document) throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        document.addPage(page);
        return page;
    }

    private float drawHeader(PDPageContentStream contentStream, PIP pip, User employee, User manager, User hrbp, float yPos) throws IOException {
        // Company Header
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 16);
        contentStream.newLineAtOffset(MARGIN, yPos);
        contentStream.showText("PERFORMANCE IMPROVEMENT PLAN - TRACK RECORD");
        contentStream.endText();
        yPos -= 30;

        // Confidential watermark
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
        contentStream.setNonStrokingColor(0.7f, 0.7f, 0.7f);
        contentStream.newLineAtOffset(MARGIN, yPos);
        contentStream.showText("CONFIDENTIAL - INTERNAL USE ONLY");
        contentStream.endText();
        yPos -= 30;

        // PIP Information
        contentStream.setNonStrokingColor(0, 0, 0);
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
        contentStream.newLineAtOffset(MARGIN, yPos);
        contentStream.showText("PIP Information:");
        contentStream.endText();
        yPos -= 20;

        float leftColumn = MARGIN;
        float rightColumn = MARGIN + CONTENT_WIDTH / 2;

        // Left column
        yPos = drawLabelValue(contentStream, "PIP ID:", pip.getId(), leftColumn, yPos, 10);
        yPos = drawLabelValue(contentStream, "Employee:", 
            employee != null ? employee.getFirstName() + " " + employee.getLastName() : "N/A", 
            leftColumn, yPos, 10);
        yPos = drawLabelValue(contentStream, "Employee ID:", 
            employee != null ? employee.getId() : "N/A", leftColumn, yPos, 10);
        yPos = drawLabelValue(contentStream, "Department:", 
            employee != null && employee.getDepartment() != null ? employee.getDepartment() : "N/A", 
            leftColumn, yPos, 10);

        // Right column
        float rightYPos = PAGE_HEIGHT - MARGIN - 60;
        rightYPos = drawLabelValue(contentStream, "Manager:", 
            manager != null ? manager.getFirstName() + " " + manager.getLastName() : "N/A", 
            rightColumn, rightYPos, 10);
        rightYPos = drawLabelValue(contentStream, "HRBP:", 
            hrbp != null ? hrbp.getFirstName() + " " + hrbp.getLastName() : "N/A", 
            rightColumn, rightYPos, 10);
        rightYPos = drawLabelValue(contentStream, "Generated:", 
            LocalDateTime.now().format(DATE_FORMATTER), rightColumn, rightYPos, 10);

        return Math.min(yPos, rightYPos) - 20;
    }

    private float drawExecutiveSummary(PDPageContentStream contentStream, PIP pip, float yPos) throws IOException {
        yPos = drawSectionHeader(contentStream, "Executive Summary", yPos);

        yPos = drawLabelValue(contentStream, "Status:", pip.getStatus().name().replace("_", " "), MARGIN, yPos, 10);
        
        if (pip.getCreatedAt() != null) {
            yPos = drawLabelValue(contentStream, "Start Date:", pip.getCreatedAt().format(DATE_FORMATTER), MARGIN, yPos, 10);
        }
        
        if (pip.getActivePeriodEndedAt() != null) {
            yPos = drawLabelValue(contentStream, "End Date:", pip.getActivePeriodEndedAt().format(DATE_FORMATTER), MARGIN, yPos, 10);
        }

        if (pip.getFinalOutcome() != null) {
            yPos = drawLabelValue(contentStream, "Outcome:", pip.getFinalOutcome().name().replace("_", " "), MARGIN, yPos, 10);
        }

        // Success Score
        if (pip.getSuccessCriteriaMetadata() != null) {
            yPos = drawLabelValue(contentStream, "Success Score:", "See Performance Metrics section", MARGIN, yPos, 10);
        }

        if (pip.getReason() != null && !pip.getReason().isEmpty()) {
            yPos -= 10;
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
            contentStream.newLineAtOffset(MARGIN, yPos);
            contentStream.showText("Reason for PIP:");
            contentStream.endText();
            yPos -= 15;
            yPos = drawWrappedText(contentStream, pip.getReason(), MARGIN, yPos, CONTENT_WIDTH, 10);
        }

        return yPos - 20;
    }

    private float drawWorkflowTimeline(PDPageContentStream contentStream, PIP pip, float yPos) throws IOException {
        yPos = drawSectionHeader(contentStream, "Workflow Timeline", yPos);

        List<PIPStep> steps = pip.getSteps();
        if (steps != null && !steps.isEmpty()) {
            for (PIPStep step : steps) {
                String stepName = step.getStep().name().replace("_", " ");
                String status = step.getStatus() != null ? step.getStatus().name().replace("_", " ") : "PENDING";
                
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                contentStream.newLineAtOffset(MARGIN, yPos);
                contentStream.showText(stepName + " - " + status);
                contentStream.endText();
                yPos -= 15;

                if (step.getDueDate() != null) {
                    yPos = drawLabelValue(contentStream, "Due Date:", step.getDueDate(), MARGIN + 20, yPos, 9);
                }
                if (step.getCompletedDate() != null) {
                    yPos = drawLabelValue(contentStream, "Completed:", step.getCompletedDate(), MARGIN + 20, yPos, 9);
                }
                if (step.getSignedBy() != null) {
                    yPos = drawLabelValue(contentStream, "Signed By:", step.getSignedBy(), MARGIN + 20, yPos, 9);
                }
                yPos -= 10;
            }
        }

        // Actual timestamps
        yPos -= 10;
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
        contentStream.newLineAtOffset(MARGIN, yPos);
        contentStream.showText("Key Milestones:");
        contentStream.endText();
        yPos -= 15;

        if (pip.getHrbpApprovedAt() != null) {
            yPos = drawLabelValue(contentStream, "HRBP Approved:", 
                pip.getHrbpApprovedAt().format(DATETIME_FORMATTER), MARGIN + 20, yPos, 9);
        }
        if (pip.getEmployeeAcknowledgedAt() != null) {
            yPos = drawLabelValue(contentStream, "Employee Acknowledged:", 
                pip.getEmployeeAcknowledgedAt().format(DATETIME_FORMATTER), MARGIN + 20, yPos, 9);
        }
        if (pip.getActivePeriodStartedAt() != null) {
            yPos = drawLabelValue(contentStream, "Active Period Started:", 
                pip.getActivePeriodStartedAt().format(DATETIME_FORMATTER), MARGIN + 20, yPos, 9);
        }
        if (pip.getActivePeriodEndedAt() != null) {
            yPos = drawLabelValue(contentStream, "Active Period Ended:", 
                pip.getActivePeriodEndedAt().format(DATETIME_FORMATTER), MARGIN + 20, yPos, 9);
        }
        if (pip.getSelfReviewSubmittedAt() != null) {
            yPos = drawLabelValue(contentStream, "Self-Review Submitted:", 
                pip.getSelfReviewSubmittedAt().format(DATETIME_FORMATTER), MARGIN + 20, yPos, 9);
        }
        if (pip.getManagerReviewCompletedAt() != null) {
            yPos = drawLabelValue(contentStream, "Manager Review Completed:", 
                pip.getManagerReviewCompletedAt().format(DATETIME_FORMATTER), MARGIN + 20, yPos, 9);
        }

        return yPos - 20;
    }

    private float drawGoalsSection(PDPageContentStream contentStream, PIP pip, float yPos) throws IOException {
        yPos = drawSectionHeader(contentStream, "Goals & Objectives", yPos);

        List<Goal> goals = pip.getGoals();
        if (goals != null && !goals.isEmpty()) {
            int goalNum = 1;
            for (Goal goal : goals) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                contentStream.newLineAtOffset(MARGIN, yPos);
                contentStream.showText("Goal " + goalNum + ": " + goal.getTitle());
                contentStream.endText();
                yPos -= 15;

                if (goal.getDescription() != null) {
                    yPos = drawWrappedText(contentStream, "Description: " + goal.getDescription(), 
                        MARGIN + 20, yPos, CONTENT_WIDTH - 20, 9);
                }

                yPos = drawLabelValue(contentStream, "Weightage:", 
                    goal.getWeightage() != null ? goal.getWeightage() + "%" : "N/A", 
                    MARGIN + 20, yPos, 9);

                if (goal.getExpectedOutcome() != null) {
                    yPos = drawWrappedText(contentStream, "Expected Outcome: " + goal.getExpectedOutcome(), 
                        MARGIN + 20, yPos, CONTENT_WIDTH - 20, 9);
                }

                if (goal.getStatus() != null) {
                    yPos = drawLabelValue(contentStream, "Status:", 
                        goal.getStatus().name().replace("_", " "), MARGIN + 20, yPos, 9);
                }

                if (goal.getManagerComments() != null && !goal.getManagerComments().isEmpty()) {
                    yPos = drawWrappedText(contentStream, "Manager Comments: " + goal.getManagerComments(), 
                        MARGIN + 20, yPos, CONTENT_WIDTH - 20, 9);
                }

                if (goal.getJustification() != null && !goal.getJustification().isEmpty()) {
                    yPos = drawWrappedText(contentStream, "Employee Justification: " + goal.getJustification(), 
                        MARGIN + 20, yPos, CONTENT_WIDTH - 20, 9);
                }

                yPos -= 15;
                goalNum++;

                if (yPos < 100) {
                    return yPos; // Need new page
                }
            }
        } else {
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
            contentStream.newLineAtOffset(MARGIN, yPos);
            contentStream.showText("No goals defined for this PIP.");
            contentStream.endText();
            yPos -= 20;
        }

        return yPos - 20;
    }

    private float drawCheckInHistory(PDPageContentStream contentStream, PIP pip, float yPos) throws IOException {
        yPos = drawSectionHeader(contentStream, "Check-in History", yPos);

        List<CheckIn> checkIns = pip.getCheckIns();
        if (checkIns != null && !checkIns.isEmpty()) {
            int checkInNum = 1;
            for (CheckIn checkIn : checkIns) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                contentStream.newLineAtOffset(MARGIN, yPos);
                contentStream.showText("Check-in #" + checkInNum);
                contentStream.endText();
                yPos -= 15;

                if (checkIn.getDate() != null) {
                    yPos = drawLabelValue(contentStream, "Date:", checkIn.getDate(), MARGIN + 20, yPos, 9);
                }

                if (checkIn.getNotes() != null && !checkIn.getNotes().isEmpty()) {
                    yPos = drawWrappedText(contentStream, "Notes: " + checkIn.getNotes(), 
                        MARGIN + 20, yPos, CONTENT_WIDTH - 20, 9);
                }

                yPos -= 15;
                checkInNum++;

                if (yPos < 100) {
                    return yPos; // Need new page
                }
            }
        } else {
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
            contentStream.newLineAtOffset(MARGIN, yPos);
            contentStream.showText("No check-ins recorded for this PIP.");
            contentStream.endText();
            yPos -= 20;
        }

        return yPos - 20;
    }

    private float drawPerformanceMetrics(PDPageContentStream contentStream, PIP pip, float yPos) throws IOException {
        yPos = drawSectionHeader(contentStream, "Performance Metrics", yPos);

        if (pip.getSuccessCriteriaMetadata() != null) {
            yPos = drawWrappedText(contentStream, 
                "Success criteria details are stored in metadata. See system for full breakdown.", 
                MARGIN, yPos, CONTENT_WIDTH, 10);
            yPos -= 15;
        }

        // Calculate goal achievement summary
        List<Goal> goals = pip.getGoals();
        if (goals != null && !goals.isEmpty()) {
            long achieved = goals.stream().filter(g -> g.getStatus() == GoalStatus.ACHIEVED).count();
            long partiallyAchieved = goals.stream().filter(g -> g.getStatus() == GoalStatus.PARTIALLY_ACHIEVED).count();
            long notAchieved = goals.stream().filter(g -> g.getStatus() == GoalStatus.NOT_ACHIEVED).count();

            yPos = drawLabelValue(contentStream, "Goals Achieved:", String.valueOf(achieved), MARGIN, yPos, 10);
            yPos = drawLabelValue(contentStream, "Goals Partially Achieved:", String.valueOf(partiallyAchieved), MARGIN, yPos, 10);
            yPos = drawLabelValue(contentStream, "Goals Not Achieved:", String.valueOf(notAchieved), MARGIN, yPos, 10);
        }

        return yPos - 20;
    }

    private float drawReviewSummaries(PDPageContentStream contentStream, PIP pip, float yPos) throws IOException {
        yPos = drawSectionHeader(contentStream, "Review Summaries", yPos);

        // Employee Self-Review
        if (pip.getSelfReviewSubmittedAt() != null) {
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
            contentStream.newLineAtOffset(MARGIN, yPos);
            contentStream.showText("Employee Self-Review");
            contentStream.endText();
            yPos -= 15;
            yPos = drawLabelValue(contentStream, "Submitted:", 
                pip.getSelfReviewSubmittedAt().format(DATETIME_FORMATTER), MARGIN + 20, yPos, 9);
            yPos -= 10;
        }

        // Manager Review
        if (pip.getManagerReviewCompletedAt() != null) {
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
            contentStream.newLineAtOffset(MARGIN, yPos);
            contentStream.showText("Manager Review");
            contentStream.endText();
            yPos -= 15;
            yPos = drawLabelValue(contentStream, "Completed:", 
                pip.getManagerReviewCompletedAt().format(DATETIME_FORMATTER), MARGIN + 20, yPos, 9);
            yPos -= 10;
        }

        // HRBP Final Decision
        if (pip.getFinalOutcome() != null) {
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
            contentStream.newLineAtOffset(MARGIN, yPos);
            contentStream.showText("HRBP Final Decision");
            contentStream.endText();
            yPos -= 15;
            yPos = drawLabelValue(contentStream, "Outcome:", 
                pip.getFinalOutcome().name().replace("_", " "), MARGIN + 20, yPos, 9);
            if (pip.getFinalRemarks() != null && !pip.getFinalRemarks().isEmpty()) {
                yPos = drawWrappedText(contentStream, "Remarks: " + pip.getFinalRemarks(), 
                    MARGIN + 20, yPos, CONTENT_WIDTH - 20, 9);
            }
        }

        return yPos - 20;
    }

    private float drawExtensionHistory(PDPageContentStream contentStream, PIP pip, float yPos) throws IOException {
        yPos = drawSectionHeader(contentStream, "Extension History", yPos);

        yPos = drawLabelValue(contentStream, "Number of Extensions:", 
            pip.getExtensionCount() != null ? String.valueOf(pip.getExtensionCount()) : "0", MARGIN, yPos, 10);

        if (pip.getOriginalActiveDuration() != null && pip.getTimeline() != null) {
            yPos = drawLabelValue(contentStream, "Original Duration:", 
                pip.getOriginalActiveDuration() + " days", MARGIN, yPos, 10);
            yPos = drawLabelValue(contentStream, "Current Duration:", 
                pip.getTimeline().getPipActiveDuration() != null ? 
                    pip.getTimeline().getPipActiveDuration() + " days" : "N/A", MARGIN, yPos, 10);
        }

        return yPos - 20;
    }

    private void drawFooter(PDPageContentStream contentStream, PDPage page, int pageNumber) throws IOException {
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8);
        contentStream.setNonStrokingColor(0.5f, 0.5f, 0.5f);
        contentStream.newLineAtOffset(MARGIN, 30);
        contentStream.showText("Page " + pageNumber + " | Generated by PIP Management System | CONFIDENTIAL");
        contentStream.endText();
    }

    private float drawSectionHeader(PDPageContentStream contentStream, String title, float yPos) throws IOException {
        yPos -= 10;
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
        contentStream.newLineAtOffset(MARGIN, yPos);
        contentStream.showText(title);
        contentStream.endText();
        yPos -= 20;
        return yPos;
    }

    private float drawLabelValue(PDPageContentStream contentStream, String label, String value, float x, float y, float fontSize) throws IOException {
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), fontSize);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(label);
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), fontSize);
        contentStream.newLineAtOffset(x + 100, y);
        contentStream.showText(value != null ? value : "N/A");
        contentStream.endText();

        return y - (fontSize + 5);
    }

    private float drawWrappedText(PDPageContentStream contentStream, String text, float x, float y, float maxWidth, float fontSize) throws IOException {
        if (text == null || text.isEmpty()) {
            return y;
        }

        String[] words = text.split(" ");
        StringBuilder line = new StringBuilder();
        float lineHeight = fontSize + 5;
        float currentY = y;

        for (String word : words) {
            String testLine = line.length() > 0 ? line + " " + word : word;
            float textWidth = new PDType1Font(Standard14Fonts.FontName.HELVETICA).getStringWidth(testLine) / 1000 * fontSize;

            if (textWidth > maxWidth && line.length() > 0) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), fontSize);
                contentStream.newLineAtOffset(x, currentY);
                contentStream.showText(line.toString());
                contentStream.endText();
                currentY -= lineHeight;
                line = new StringBuilder(word);
            } else {
                line.append(line.length() > 0 ? " " + word : word);
            }
        }

        if (line.length() > 0) {
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), fontSize);
            contentStream.newLineAtOffset(x, currentY);
            contentStream.showText(line.toString());
            contentStream.endText();
            currentY -= lineHeight;
        }

        return currentY;
    }
}
