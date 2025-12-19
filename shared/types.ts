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
  
  // Optional appraisal reference fields (READ-ONLY metadata only)
  // Manager may optionally reference an appraisal when creating a PIP manually
  // These fields are for context/reference only and do NOT create any dependencies
  appraisalParticipantId?: string; // OPTIONAL: Manager's manual reference to appraisal participant
  appraisalCycleId?: string; // OPTIONAL: Manager's manual reference to appraisal cycle
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

// =====================================================
// Appraisal Types - Integrated with PIP
// =====================================================

export type AppraisalCycleStatus = 'DRAFT' | 'ACTIVE' | 'LOCKED' | 'COMPLETED' | 'CANCELLED';

export type ParticipantStatus = 
  | 'ELIGIBLE'
  | 'IN_PROGRESS'
  | 'GOALS_LOCKED'
  | 'REVIEW_IN_PROGRESS'
  | 'CALIBRATION_PENDING'
  | 'CALIBRATED'
  | 'OUTCOME_RELEASED'
  | 'ACKNOWLEDGED'
  | 'EXCLUDED';

export type AppraisalGoalType = 
  | 'BUSINESS_GOAL'
  | 'BEHAVIORAL_GOAL'
  | 'COMPETENCY_GOAL'
  | 'OKR'
  | 'DEVELOPMENT_GOAL';

export type AppraisalGoalStatus = 
  | 'ACTIVE'
  | 'LOCKED'
  | 'ACHIEVED'
  | 'PARTIALLY_ACHIEVED'
  | 'NOT_ACHIEVED';

export interface AppraisalCycle {
  id: string;
  cycleName: string;
  startDate: string;
  endDate: string;
  status: AppraisalCycleStatus;
  description?: string;
  eligibilityRules?: any; // JSON
  reviewTypes?: any; // JSON
  ratingScale?: any; // JSON
  forcedDistributionEnabled?: boolean;
  forcedDistributionRules?: any; // JSON
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
}

export interface AppraisalParticipant {
  id: string;
  cycleId: string;
  employeeId: string;
  managerId: string;
  skipLevelManagerId?: string;
  hrbpId?: string;
  status: ParticipantStatus;
  eligibilityReason?: string;
  goalsLocked?: boolean;
  goalsLockedAt?: string;
  selfReviewSubmitted?: boolean;
  selfReviewSubmittedAt?: string;
  managerReviewSubmitted?: boolean;
  managerReviewSubmittedAt?: string;
  skipReviewSubmitted?: boolean;
  skipReviewSubmittedAt?: string;
  calibrated?: boolean;
  calibratedAt?: string;
  finalOutcomeReleased?: boolean;
  finalOutcomeReleasedAt?: string;
  employeeAcknowledged?: boolean;
  employeeAcknowledgedAt?: string;
  employeeAcknowledgementComments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppraisalGoal {
  id: string;
  participantId: string;
  goalType: AppraisalGoalType;
  title: string;
  description?: string;
  weightage: number;
  successCriteria?: string;
  status: AppraisalGoalStatus;
  source?: any; // JSON
  createdAt: string;
  updatedAt: string;
}

export interface AppraisalOutcome {
  id: string;
  participantId: string;
  finalRating: number;
  finalRatingLabel?: string;
  promotionRecommendation?: boolean;
  bonusPercentage?: number;
  hikePercentage?: number;
  developmentPlan?: string;
  pipTriggered: boolean;
  pipId?: string; // Reference to PIP if one was created
  summary?: string;
  approvedBy: string;
  approvedAt: string;
  releasedToEmployee?: boolean;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// Helper Types for Optional Reference (Read-Only Metadata)
// =====================================================
// Note: These types are for display purposes only when showing
// optional appraisal references in PIP context. They do NOT
// imply integration or dependencies between modules.

export interface PIPWithOptionalAppraisalReference extends PIP {
  // Optional read-only reference data (if manager included appraisal reference)
  appraisalParticipant?: AppraisalParticipant;
  appraisalCycle?: AppraisalCycle;
  // Note: These are for display context only, not dependencies
}

