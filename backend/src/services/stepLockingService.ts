import { PIP, PIPStep } from '../types/index.js';

export class StepLockingService {
  canAccessStep(pip: PIP, stepName: string, userId: string, userRole: string): boolean {
    // Admin can always access
    if (userRole === 'admin') return true;

    // If PIP is locked, only admin can access
    if (pip.locked) return false;

    // Check if previous steps are completed
    const stepOrder = [
      'employee_acknowledgement',
      'active_pip',
      'employee_self_review',
      'manager_review',
      'hrbp_decision',
    ];

    const currentStepIndex = stepOrder.indexOf(stepName);
    if (currentStepIndex === -1) return false;

    // Check all previous steps are completed
    for (let i = 0; i < currentStepIndex; i++) {
      const prevStep = pip.steps.find(s => s.step === stepOrder[i]);
      if (!prevStep || prevStep.status !== 'completed') {
        return false;
      }
    }

    // Role-based access control
    if (stepName === 'employee_acknowledgement' || stepName === 'employee_self_review') {
      return userRole === 'employee' && pip.employeeId === userId;
    }

    if (stepName === 'manager_review') {
      return userRole === 'manager' && pip.managerId === userId;
    }

    if (stepName === 'hrbp_decision' || stepName === 'hrbp_review') {
      return userRole === 'hrbp' && pip.hrbpId === userId;
    }

    return false;
  }

  canCompleteStep(pip: PIP, stepName: string, userId: string, userRole: string): boolean {
    if (!this.canAccessStep(pip, stepName, userId, userRole)) {
      return false;
    }

    // Check if step is overdue (unless admin override)
    const step = pip.steps.find(s => s.step === stepName);
    if (!step) return false;

    // Allow completion if overdue (admin can override, others get warning)
    if (step.status === 'overdue' && userRole !== 'admin') {
      // Still allow but will be logged as overdue completion
      return true;
    }

    return step.status === 'pending' || step.status === 'due_soon' || step.status === 'overdue';
  }

  isStepLocked(pip: PIP, stepName: string): boolean {
    if (pip.locked) return true;

    const stepOrder = [
      'employee_acknowledgement',
      'active_pip',
      'employee_self_review',
      'manager_review',
      'hrbp_decision',
    ];

    const currentStepIndex = stepOrder.indexOf(stepName);
    if (currentStepIndex === -1) return true;

    // Check all previous steps are completed
    for (let i = 0; i < currentStepIndex; i++) {
      const prevStep = pip.steps.find(s => s.step === stepOrder[i]);
      if (!prevStep || prevStep.status !== 'completed') {
        return true;
      }
    }

    return false;
  }

  getNextUnlockedStep(pip: PIP): string | null {
    const stepOrder = [
      'employee_acknowledgement',
      'active_pip',
      'employee_self_review',
      'manager_review',
      'hrbp_decision',
    ];

    for (const stepName of stepOrder) {
      if (!this.isStepLocked(pip, stepName)) {
        const step = pip.steps.find(s => s.step === stepName);
        if (step && step.status !== 'completed') {
          return stepName;
        }
      }
    }

    return null;
  }
}

export const stepLockingService = new StepLockingService();

