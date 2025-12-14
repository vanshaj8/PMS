import { PIPTimeline, Goal } from '../types/index.js';

export interface TimelineValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class TimelineValidationService {
  validateTimeline(timeline: PIPTimeline, goals?: Goal[]): TimelineValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // TC1-TC6: Timeline Entry Validation
    if (!timeline.pipActiveDuration || timeline.pipActiveDuration <= 0) {
      errors.push('PIP duration must be greater than 0');
    }

    if (timeline.pipActiveDuration > 365) {
      errors.push('PIP duration cannot exceed 365 days');
    }

    if (!Number.isInteger(timeline.pipActiveDuration)) {
      errors.push('PIP duration must be a whole number');
    }

    // TC7-TC11: Auto Due Date Calculation Validation
    const employeeAckDate = new Date(timeline.employeeAcknowledgementDeadline);
    const selfReviewDate = new Date(timeline.employeeSelfReviewDeadline);
    const managerReviewDate = new Date(timeline.managerFinalReviewDeadline);
    const hrbpDecisionDate = new Date(timeline.hrbpFinalDecisionDeadline);

    if (isNaN(employeeAckDate.getTime())) {
      errors.push('Invalid employee acknowledgement deadline');
    }

    if (isNaN(selfReviewDate.getTime())) {
      errors.push('Invalid employee self-review deadline');
    }

    if (isNaN(managerReviewDate.getTime())) {
      errors.push('Invalid manager review deadline');
    }

    if (isNaN(hrbpDecisionDate.getTime())) {
      errors.push('Invalid HRBP decision deadline');
    }

    // Validate date sequence
    const now = new Date();
    if (employeeAckDate < now) {
      warnings.push('Employee acknowledgement deadline is in the past');
    }

    if (selfReviewDate < employeeAckDate) {
      errors.push('Employee self-review deadline must be after acknowledgement deadline');
    }

    if (managerReviewDate < selfReviewDate) {
      errors.push('Manager review deadline must be after employee self-review deadline');
    }

    if (hrbpDecisionDate < managerReviewDate) {
      errors.push('HRBP decision deadline must be after manager review deadline');
    }

    // Calculate active PIP end date
    const activeEndDate = new Date(employeeAckDate);
    activeEndDate.setDate(activeEndDate.getDate() + timeline.pipActiveDuration);

    if (selfReviewDate > activeEndDate) {
      warnings.push('Employee self-review deadline is after active PIP period ends');
    }

    // TC12-TC16: Goal-Level Deadlines Validation
    if (goals) {
      goals.forEach((goal, index) => {
        if (goal.targetTimeline) {
          const goalDeadline = new Date(goal.targetTimeline);
          
          if (isNaN(goalDeadline.getTime())) {
            errors.push(`Goal ${index + 1}: Invalid deadline format`);
          } else {
            if (goalDeadline < employeeAckDate) {
              errors.push(`Goal ${index + 1}: Deadline cannot be before PIP start date`);
            }
            
            if (goalDeadline > activeEndDate) {
              errors.push(`Goal ${index + 1}: Deadline cannot exceed overall PIP end date`);
            }
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  calculateDueDate(startDate: Date, durationDays: number): Date {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + durationDays);
    return dueDate;
  }

  isOverdue(dueDate: string, gracePeriod?: number): boolean {
    const due = new Date(dueDate);
    const now = new Date();
    
    if (gracePeriod) {
      due.setDate(due.getDate() + gracePeriod);
    }
    
    return now > due;
  }

  getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const timelineValidationService = new TimelineValidationService();

