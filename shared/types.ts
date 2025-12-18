export type UserRole = 'manager' | 'employee' | 'hrbp' | 'admin' | 'executive';

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  location?: string;
  managerId?: string;
  hrbpId?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  weightage: number; // percentage
  expectedOutcome: string;
  targetTimeline: string; // Goal-level deadline (TC12-TC16)
  attachments?: string[];
  justification?: string;
  employeeAttachments?: string[];
  status?: 'achieved' | 'partially_achieved' | 'not_achieved';
  managerComments?: string;
  deadline?: string; // Optional goal-specific deadline
}

export interface PIPTimeline {
  // Durations (in days) - what managers set
  employeeAcknowledgementDuration?: number; // days from HRBP approval
  pipActiveDuration: number; // days from acknowledgement
  selfReviewBufferDuration?: number; // days after active period ends
  managerReviewBufferDuration?: number; // days after self-review
  hrbpDecisionBufferDuration?: number; // days after manager review
  gracePeriod?: number; // days - grace period for late submissions
  
  // Legacy fields (deprecated - kept for backward compatibility)
  employeeAcknowledgementDeadline?: string; // DEPRECATED - calculated dynamically
  employeeSelfReviewDeadline?: string; // DEPRECATED - calculated dynamically
  managerFinalReviewDeadline?: string; // DEPRECATED - calculated dynamically
  hrbpFinalDecisionDeadline?: string; // DEPRECATED - calculated dynamically
}

export type PIPStatus = 
  | 'draft'
  | 'pending_hrbp_review'
  | 'pending_employee_acknowledgement'
  | 'overdue_employee_acknowledgement' // New: Employee missed acknowledgement deadline
  | 'active'
  | 'active_pending_validation' // New: Active period ended but validation pending
  | 'pending_employee_self_review'
  | 'pending_manager_review'
  | 'overdue_manager_review' // New: Manager missed review deadline
  | 'pending_hrbp_decision'
  | 'overdue_hrbp_decision' // New: HRBP missed decision deadline
  | 'admin_intervention_required' // New: Escalated to admin
  | 'completed'
  | 'overdue'
  | 'cancelled'
  | 'deemed_acknowledged'; // New: HRBP marked as acknowledged after employee missed deadline

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

export interface AuditLog {
  id: string;
  pipId?: string;
  userId: string;
  action: string;
  details: any;
  timestamp: string;
  ipAddress?: string;
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
  
  // Actual timestamps for deadline calculation
  hrbpApprovedAt?: string; // When HRBP approved initial review
  employeeAcknowledgedAt?: string; // When employee acknowledged
  activePeriodStartedAt?: string; // When active period actually started
  activePeriodEndedAt?: string; // When active period ended
  selfReviewSubmittedAt?: string; // When employee submitted self-review
  managerReviewCompletedAt?: string; // When manager completed review
  
  // Extension tracking
  extensionCount?: number; // Number of times PIP has been extended
  originalActiveDuration?: number; // Original duration before extensions
}

export interface PIPTemplate {
  id: string;
  name: string;
  description: string;
  goals: Omit<Goal, 'id'>[];
  defaultTimeline: Partial<PIPTimeline>;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface GoalLibrary {
  id: string;
  title: string;
  description: string;
  defaultWeightage: number;
  expectedOutcome: string;
  category?: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
}

export interface TimelineOverride {
  id: string;
  pipId: string;
  step: string;
  originalDueDate: string;
  newDueDate: string;
  reason: string;
  overriddenBy: string;
  overriddenAt: string;
}

export interface DashboardStats {
  totalPIPs: number;
  activePIPs: number;
  pendingAction: number;
  overduePIPs: number;
  successRate: number;
  averageDuration: number;
}

