import { PIP, PIPStep } from '../types/index.js';

export interface SLAMetrics {
  stepName: string;
  dueDate: string;
  completedDate?: string;
  targetSLA: number; // days
  actualDuration?: number; // days
  onTime: boolean;
  delayDays?: number;
}

export class SLATrackingService {
  calculateSLA(pip: PIP): SLAMetrics[] {
    const metrics: SLAMetrics[] = [];

    for (const step of pip.steps) {
      const dueDate = new Date(step.dueDate);
      const completedDate = step.completedDate ? new Date(step.completedDate) : null;
      
      // Calculate target SLA (days from PIP creation to due date)
      const pipCreated = new Date(pip.createdAt);
      const targetSLA = Math.ceil((dueDate.getTime() - pipCreated.getTime()) / (1000 * 60 * 60 * 24));

      let actualDuration: number | undefined;
      let onTime = true;
      let delayDays: number | undefined;

      if (completedDate) {
        actualDuration = Math.ceil((completedDate.getTime() - pipCreated.getTime()) / (1000 * 60 * 60 * 24));
        
        if (completedDate > dueDate) {
          onTime = false;
          delayDays = Math.ceil((completedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      } else {
        // Not completed yet
        const now = new Date();
        if (now > dueDate) {
          onTime = false;
          delayDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      metrics.push({
        stepName: step.step,
        dueDate: step.dueDate,
        completedDate: step.completedDate,
        targetSLA,
        actualDuration,
        onTime,
        delayDays,
      });
    }

    return metrics;
  }

  getAverageStepCompletionTime(pips: PIP[]): Record<string, number> {
    const stepTimes: Record<string, number[]> = {};

    for (const pip of pips) {
      const metrics = this.calculateSLA(pip);
      for (const metric of metrics) {
        if (metric.actualDuration !== undefined) {
          if (!stepTimes[metric.stepName]) {
            stepTimes[metric.stepName] = [];
          }
          stepTimes[metric.stepName].push(metric.actualDuration);
        }
      }
    }

    const averages: Record<string, number> = {};
    for (const [stepName, times] of Object.entries(stepTimes)) {
      const sum = times.reduce((a, b) => a + b, 0);
      averages[stepName] = Math.round((sum / times.length) * 100) / 100;
    }

    return averages;
  }

  getSLAComplianceRate(pips: PIP[]): Record<string, number> {
    const stepCounts: Record<string, { total: number; onTime: number }> = {};

    for (const pip of pips) {
      const metrics = this.calculateSLA(pip);
      for (const metric of metrics) {
        if (!stepCounts[metric.stepName]) {
          stepCounts[metric.stepName] = { total: 0, onTime: 0 };
        }
        stepCounts[metric.stepName].total++;
        if (metric.onTime) {
          stepCounts[metric.stepName].onTime++;
        }
      }
    }

    const compliance: Record<string, number> = {};
    for (const [stepName, counts] of Object.entries(stepCounts)) {
      compliance[stepName] = Math.round((counts.onTime / counts.total) * 100 * 100) / 100;
    }

    return compliance;
  }
}

export const slaTrackingService = new SLATrackingService();

