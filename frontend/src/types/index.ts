export type UserRole = 'manager' | 'employee' | 'hrbp' | 'admin' | 'executive';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  location?: string;
  managerId?: string;
  hrbpId?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  weightage: number;
  expectedOutcome: string;
  targetTimeline: string;
  attachments?: string[];
  justification?: string;
  employeeAttachments?: string[];
  status?: 'achieved' | 'partially_achieved' | 'not_achieved';
  managerComments?: string;
}

export interface PIPTimeline {
  employeeAcknowledgementDeadline: string;
  pipActiveDuration: number;
  employeeSelfReviewDeadline: string;
  managerFinalReviewDeadline: string;
  hrbpFinalDecisionDeadline: string;
  gracePeriod?: number;
}

export type PIPStatus = 
  | 'draft'
  | 'pending_hrbp_review'
  | 'pending_employee_acknowledgement'
  | 'active'
  | 'pending_employee_self_review'
  | 'pending_manager_review'
  | 'pending_hrbp_decision'
  | 'completed'
  | 'overdue'
  | 'denied'
  | 'closed';

export type StepStatus = 'pending' | 'due_soon' | 'overdue' | 'completed';

export interface PIPStep {
  step: string;
  status: StepStatus;
  dueDate: string;
  completedDate?: string;
  comments?: string;
  signedBy?: string;
  signedAt?: string;
}

export interface CheckIn {
  id: string;
  pipId: string;
  date: string;
  notes: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
}

export interface PIP {
  id: string;
  employeeId: string;
  managerId: string;
  hrbpId: string;
  reason: string;
  supportingDocuments: string[];
  goals: Goal[];
  timeline: PIPTimeline;
  status: PIPStatus;
  steps: PIPStep[];
  checkIns: CheckIn[];
  finalOutcome?: 'successful' | 'unsuccessful' | 'extended' | 'closed_without_action';
  finalRemarks?: string;
  createdAt: string;
  updatedAt: string;
  locked: boolean;
  version: number;
}

export interface DashboardStats {
  totalPIPs: number;
  activePIPs: number;
  pendingAction: number;
  overduePIPs: number;
  successRate: number;
  averageDuration: number;
}

