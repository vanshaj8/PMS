import api from './api';

export interface GlobalKPIs {
  totalEmployees: number;
  activePIPs: number;
  appraisalCycles: number;
  reviewsPending: number;
  overdueActions: number;
}

export interface RiskAlert {
  type: string;
  severity: 'RED' | 'ORANGE' | 'GREEN';
  title: string;
  description: string;
  count: number;
  action: string;
}

export interface PIPSnapshot {
  activePIPs: number;
  newPIPsThisMonth: number;
  successRate: number;
  failureRate: number;
  avgDuration: number;
  byDepartment: Record<string, number>;
  byOutcome: Record<string, number>;
}

export interface CycleStatus {
  cycleId: string;
  cycleName: string;
  status: string;
  completion: number;
  overdue: number;
}

export interface AppraisalSnapshot {
  cycleStatus: CycleStatus[];
  selfReviewsPending: number;
  managerReviewsPending: number;
  calibrationPending: number;
  finalized: number;
  finalizedPercent: number;
}

export interface ManagerLoad {
  managerId: string;
  managerName: string;
  employeeCount: number;
  status: 'OVERLOADED' | 'AT_RISK' | 'BALANCED';
}

export interface OrgHealth {
  managerLoad: ManagerLoad[];
  missingManagers: number;
  missingHRBPs: number;
  totalUsers: number;
}

export interface RatingDistribution {
  distribution: Record<string, number>;
  total: number;
}

export interface PerformanceTrend {
  month: string;
  pips: number;
  appraisals: number;
}

export interface ManagerRatingVariance {
  managerId: string;
  managerName: string;
  avgRating: number;
  variance: number;
  count: number;
}

export interface HighLowPerformers {
  high: number;
  mid: number;
  low: number;
  total: number;
}

export interface AdminDashboardData {
  globalKPIs: GlobalKPIs;
  riskAlerts: RiskAlert[];
  pipSnapshot: PIPSnapshot;
  appraisalSnapshot: AppraisalSnapshot;
  orgHealth: OrgHealth;
}

export const adminDashboardService = {
  async getAllDashboardData(): Promise<AdminDashboardData> {
    const response = await api.get<AdminDashboardData>('/admin/dashboard/all');
    return response.data;
  },

  async getGlobalKPIs(): Promise<GlobalKPIs> {
    const response = await api.get<GlobalKPIs>('/admin/dashboard/global-kpis');
    return response.data;
  },

  async getRiskAlerts(): Promise<RiskAlert[]> {
    const response = await api.get<RiskAlert[]>('/admin/dashboard/risk-alerts');
    return response.data;
  },

  async getPIPSnapshot(): Promise<PIPSnapshot> {
    const response = await api.get<PIPSnapshot>('/admin/dashboard/pip-snapshot');
    return response.data;
  },

  async getAppraisalSnapshot(): Promise<AppraisalSnapshot> {
    const response = await api.get<AppraisalSnapshot>('/admin/dashboard/appraisal-snapshot');
    return response.data;
  },

  async getOrgHealth(): Promise<OrgHealth> {
    const response = await api.get<OrgHealth>('/admin/dashboard/org-health');
    return response.data;
  },

  async getRatingDistribution(cycleId?: string): Promise<RatingDistribution> {
    const params = cycleId ? { cycleId } : {};
    const response = await api.get<RatingDistribution>('/admin/dashboard/rating-distribution', { params });
    return response.data;
  },

  async getPerformanceTrends(): Promise<PerformanceTrend[]> {
    const response = await api.get<PerformanceTrend[]>('/admin/dashboard/performance-trends');
    return response.data;
  },

  async getManagerRatingVariance(): Promise<ManagerRatingVariance[]> {
    const response = await api.get<ManagerRatingVariance[]>('/admin/dashboard/manager-rating-variance');
    return response.data;
  },

  async getHighLowPerformers(): Promise<HighLowPerformers> {
    const response = await api.get<HighLowPerformers>('/admin/dashboard/high-low-performers');
    return response.data;
  },
};

