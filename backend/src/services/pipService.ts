import { v4 as uuidv4 } from 'uuid';
import { db } from '../utils/database.js';
import { PIP, PIPStatus, StepStatus, Goal, PIPTimeline, CheckIn, AuditLog, TimelineOverride } from '../types/index.js';
import { timelineValidationService } from './timelineValidationService.js';
import { notificationService } from './notificationService.js';
import { stepLockingService } from './stepLockingService.js';

export class PIPService {
  async createPIP(data: {
    employeeId: string;
    managerId: string;
    hrbpId: string;
    reason: string;
    supportingDocuments: string[];
    goals: Omit<Goal, 'id'>[];
    timeline: PIPTimeline;
  }): Promise<PIP> {
    // Validate goals weightage (TC55)
    const totalWeightage = data.goals.reduce((sum, goal) => sum + goal.weightage, 0);
    if (totalWeightage > 100) {
      throw new Error('Total weightage cannot exceed 100%');
    }

    // Validate timeline (TC1-TC16)
    const timelineValidation = timelineValidationService.validateTimeline(
      data.timeline,
      data.goals.map(g => ({ ...g, id: '' }))
    );

    if (!timelineValidation.isValid) {
      throw new Error(`Timeline validation failed: ${timelineValidation.errors.join(', ')}`);
    }

    const now = new Date().toISOString();
    const steps = this.initializeSteps(data.timeline);

    const pip: PIP = {
      id: uuidv4(),
      ...data,
      goals: data.goals.map(goal => ({ ...goal, id: uuidv4() })),
      status: 'pending_hrbp_review',
      steps,
      checkIns: [],
      createdAt: now,
      updatedAt: now,
      locked: false,
      version: 1,
    };

    await db.create('pips', pip);
    await this.logAudit({
      pipId: pip.id,
      userId: data.managerId,
      action: 'PIP_CREATED',
      details: { reason: data.reason, goalsCount: data.goals.length },
    });

    // Send notifications (TC27)
    await notificationService.notifyPIPCreated(pip.id, data.employeeId, data.managerId, data.hrbpId);

    return pip;
  }

  private initializeSteps(timeline: PIPTimeline): PIP['steps'] {
    const now = new Date();
    const employeeAckDate = new Date(timeline.employeeAcknowledgementDeadline);
    const activeEndDate = new Date(employeeAckDate);
    activeEndDate.setDate(activeEndDate.getDate() + timeline.pipActiveDuration);
    const selfReviewDate = new Date(timeline.employeeSelfReviewDeadline);
    const managerReviewDate = new Date(timeline.managerFinalReviewDeadline);
    const hrbpDecisionDate = new Date(timeline.hrbpFinalDecisionDeadline);

    return [
      {
        step: 'employee_acknowledgement',
        status: 'pending',
        dueDate: timeline.employeeAcknowledgementDeadline,
      },
      {
        step: 'active_pip',
        status: 'pending',
        dueDate: activeEndDate.toISOString(),
      },
      {
        step: 'employee_self_review',
        status: 'pending',
        dueDate: timeline.employeeSelfReviewDeadline,
      },
      {
        step: 'manager_review',
        status: 'pending',
        dueDate: timeline.managerFinalReviewDeadline,
      },
      {
        step: 'hrbp_decision',
        status: 'pending',
        dueDate: timeline.hrbpFinalDecisionDeadline,
      },
    ];
  }

  async updatePIPStatus(pipId: string, status: PIPStatus, userId: string): Promise<PIP | null> {
    const pip = await db.findById<PIP>('pips', pipId);
    if (!pip || pip.locked) return null;

    const updated = await db.update<PIP>('pips', pipId, {
      status,
      version: pip.version + 1,
    });

    await this.logAudit({
      pipId,
      userId,
      action: 'STATUS_UPDATED',
      details: { oldStatus: pip.status, newStatus: status },
    });

    return updated;
  }

  async updateStep(pipId: string, stepName: string, updates: {
    status?: StepStatus;
    comments?: string;
    signedBy?: string;
  }): Promise<PIP | null> {
    const pip = await db.findById<PIP>('pips', pipId);
    if (!pip) return null;

    const stepIndex = pip.steps.findIndex(s => s.step === stepName);
    if (stepIndex === -1) return null;

    const step = pip.steps[stepIndex];
    pip.steps[stepIndex] = {
      ...step,
      ...updates,
      completedDate: updates.status === 'completed' ? new Date().toISOString() : step.completedDate,
      signedAt: updates.signedBy ? new Date().toISOString() : step.signedAt,
    };

    const updated = await db.update<PIP>('pips', pipId, {
      steps: pip.steps,
      version: pip.version + 1,
    });

    await this.logAudit({
      pipId,
      userId: updates.signedBy || 'system',
      action: 'STEP_UPDATED',
      details: { step: stepName, updates },
    });

    return updated;
  }

  async addCheckIn(pipId: string, data: {
    notes: string;
    attachments?: string[];
    createdBy: string;
  }): Promise<CheckIn> {
    const checkIn: CheckIn = {
      id: uuidv4(),
      pipId,
      date: new Date().toISOString(),
      notes: data.notes,
      attachments: data.attachments || [],
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
    };

    const pip = await db.findById<PIP>('pips', pipId);
    if (!pip) throw new Error('PIP not found');

    pip.checkIns.push(checkIn);
    await db.update<PIP>('pips', pipId, { checkIns: pip.checkIns });

    return checkIn;
  }

  async updateGoals(pipId: string, goals: Goal[], userId: string): Promise<PIP | null> {
    const pip = await db.findById<PIP>('pips', pipId);
    if (!pip || pip.locked) return null;

    const totalWeightage = goals.reduce((sum, goal) => sum + goal.weightage, 0);
    if (totalWeightage > 100) {
      throw new Error('Total weightage cannot exceed 100%');
    }

    // TC16: Validate goal deadlines don't break overall timeline
    const timelineValidation = timelineValidationService.validateTimeline(pip.timeline, goals);
    if (!timelineValidation.isValid) {
      throw new Error(`Goal deadline validation failed: ${timelineValidation.errors.join(', ')}`);
    }

    // Log with old/new values (TC84)
    await this.logActionWithValues(
      pipId,
      userId,
      'GOALS_UPDATED',
      { goals: pip.goals },
      { goals }
    );

    const updated = await db.update<PIP>('pips', pipId, {
      goals,
      version: pip.version + 1,
    });

    return updated;
  }

  async overrideTimeline(
    pipId: string,
    step: string,
    newDueDate: string,
    reason: string,
    userId: string
  ): Promise<PIP | null> {
    const pip = await db.findById<PIP>('pips', pipId);
    if (!pip) return null;

    const stepIndex = pip.steps.findIndex(s => s.step === step);
    if (stepIndex === -1) return null;

    // TC17-TC20: Timeline modification validation
    const newDue = new Date(newDueDate);
    const now = new Date();
    
    // TC19: Error if reduction makes end date < today (for completed steps)
    const stepData = pip.steps[stepIndex];
    if (stepData.completedDate && newDue < new Date(stepData.completedDate)) {
      throw new Error('New due date cannot be before step completion date');
    }

    const originalDueDate = pip.steps[stepIndex].dueDate;
    pip.steps[stepIndex].dueDate = newDueDate;

    const updated = await db.update<PIP>('pips', pipId, {
      steps: pip.steps,
      version: pip.version + 1,
    });

    // Log override (TC20)
    const override: TimelineOverride = {
      id: uuidv4(),
      pipId,
      step,
      originalDueDate,
      newDueDate,
      reason,
      overriddenBy: userId,
      overriddenAt: new Date().toISOString(),
    };

    await db.create('timelineOverrides', override);

    // TC84: Log with old/new values
    await this.logActionWithValues(
      pipId,
      userId,
      'TIMELINE_OVERRIDDEN',
      { step, dueDate: originalDueDate },
      { step, dueDate: newDueDate, reason }
    );

    return updated;
  }

  async updateTimelineStatuses(): Promise<void> {
    const pips = await db.read<PIP>('pips');
    const now = new Date();

    for (const pip of pips) {
      if (pip.locked || pip.status === 'completed') continue;

      const updatedSteps = pip.steps.map(step => {
        const dueDate = new Date(step.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let status: StepStatus = step.status;
        if (step.completedDate) {
          status = 'completed';
        } else if (daysUntilDue < 0) {
          status = 'overdue';
          // TC26, TC27: Send overdue notification if not already sent
          if (step.status !== 'overdue') {
            this.sendOverdueNotification(pip, step);
          }
        } else if (daysUntilDue <= 3) {
          status = 'due_soon';
          // Send due soon notification
          if (step.status === 'pending') {
            this.sendDueSoonNotification(pip, step);
          }
        } else {
          status = 'pending';
        }

        return { ...step, status };
      });

      const hasOverdue = updatedSteps.some(s => s.status === 'overdue');
      const newStatus: PIPStatus = hasOverdue && pip.status !== 'completed' ? 'overdue' : pip.status;

      await db.update<PIP>('pips', pip.id, {
        steps: updatedSteps,
        status: newStatus,
      });
    }
  }

  private async sendOverdueNotification(pip: PIP, step: PIPStep): Promise<void> {
    let userId: string | undefined;
    
    if (step.step === 'employee_acknowledgement' || step.step === 'employee_self_review') {
      userId = pip.employeeId;
    } else if (step.step === 'manager_review') {
      userId = pip.managerId;
    } else if (step.step === 'hrbp_decision' || step.step === 'hrbp_review') {
      userId = pip.hrbpId;
    }

    if (userId) {
      await notificationService.notifyStepOverdue(pip.id, userId, step.step);
    }
  }

  private async sendDueSoonNotification(pip: PIP, step: PIPStep): Promise<void> {
    let userId: string | undefined;
    
    if (step.step === 'employee_acknowledgement' || step.step === 'employee_self_review') {
      userId = pip.employeeId;
    } else if (step.step === 'manager_review') {
      userId = pip.managerId;
    } else if (step.step === 'hrbp_decision' || step.step === 'hrbp_review') {
      userId = pip.hrbpId;
    }

    if (userId) {
      await notificationService.notifyStepDue(pip.id, userId, step.step, step.dueDate);
    }
  }

  private async logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditLog: AuditLog = {
      id: uuidv4(),
      ...log,
      timestamp: new Date().toISOString(),
    };
    await db.create('auditLogs', auditLog);
  }

  async logActionWithValues(
    pipId: string,
    userId: string,
    action: string,
    oldValues: any,
    newValues: any
  ): Promise<void> {
    await this.logAudit({
      pipId,
      userId,
      action,
      details: {
        oldValues,
        newValues,
        changes: this.calculateChanges(oldValues, newValues),
      },
    });
  }

  private calculateChanges(oldValues: any, newValues: any): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    
    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        changes[key] = {
          old: oldValues[key],
          new: newValues[key],
        };
      }
    }

    return changes;
  }
}

export const pipService = new PIPService();

