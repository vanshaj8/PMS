import api from './api';

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  description?: string;
  weightage: number;
  goalType: 'BUSINESS_GOAL' | 'BEHAVIORAL_GOAL' | 'COMPETENCY_GOAL' | 'OKR' | 'DEVELOPMENT_GOAL' | 'PIP_IMPROVEMENT_GOAL';
  successCriteria?: string;
  status: 'ACTIVE' | 'LOCKED' | 'ACHIEVED' | 'PARTIALLY_ACHIEVED' | 'NOT_ACHIEVED' | 'CANCELLED' | 'ARCHIVED';
  targetDate?: string;
  achievedDate?: string;
  versionNumber: number;
  isCurrentVersion: boolean;
  createdInContext?: string;
  isLocked: boolean;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalVersion {
  id: string;
  goalId: string;
  versionNumber: number;
  title: string;
  description?: string;
  weightage: number;
  successCriteria?: string;
  targetDate?: string;
  changeReason?: string;
  changedBy: string;
  createdAt: string;
}

export interface GoalContextLink {
  id: string;
  goalId: string;
  context: 'PIP' | 'APPRAISAL' | 'OKR' | 'PROMOTION';
  contextId: string;
  goalVersionNumber: number;
  isSnapshot: boolean;
}

export interface GoalWithHistory {
  goal: Goal;
  versions: GoalVersion[];
  contextLinks: GoalContextLink[];
}

export interface CreateGoalRequest {
  employeeId: string;
  title: string;
  description?: string;
  weightage: number;
  goalType: Goal['goalType'];
  successCriteria?: string;
  targetDate?: string;
  createdInContext?: string;
  createdInContextId?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  weightage?: number;
  successCriteria?: string;
  targetDate?: string;
  changeReason?: string;
}

export const goalService = {
  async getUserGoals(userId: string, includeArchived?: boolean): Promise<Goal[]> {
    const params: any = {};
    if (includeArchived !== undefined) {
      params.includeArchived = includeArchived;
    }
    const response = await api.get<{ goals: Goal[] }>(`/goals/users/${userId}`, { params });
    return response.data.goals;
  },

  async createGoal(request: CreateGoalRequest): Promise<Goal> {
    const response = await api.post<Goal>('/goals', request);
    return response.data;
  },

  async updateGoal(goalId: string, request: UpdateGoalRequest): Promise<Goal> {
    const response = await api.put<Goal>(`/goals/${goalId}`, request);
    return response.data;
  },

  async getGoalHistory(goalId: string): Promise<GoalWithHistory> {
    const response = await api.get<GoalWithHistory>(`/goals/${goalId}/history`);
    return response.data;
  },

  async lockGoal(goalId: string, lockReason: string): Promise<Goal> {
    const response = await api.post<Goal>(`/goals/${goalId}/lock`, { lockReason });
    return response.data;
  },
};

