import api from './api';
import { User } from '../types';

export interface UserSearchFilters {
  userName?: string;
  userId?: string;
  managerName?: string;
  managerId?: string;
  hrbpName?: string;
  hrbpId?: string;
  department?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'on_pip' | 'completed_pip';
  dateFrom?: string;
  dateTo?: string;
  missingManager?: boolean;
  missingHrbp?: boolean;
  batchId?: string;
  hasErrors?: boolean;
}

export interface UserSearchResult {
  user: User;
  manager?: User;
  hrbp?: User;
  pipCount: number;
  activePipCount: number;
  completedPipCount: number;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ userId: string; error: string }>;
}

export const userManagementService = {
  async searchUsers(filters: UserSearchFilters): Promise<UserSearchResult[]> {
    const response = await api.post<{ results: UserSearchResult[] }>('/user-management/search', filters);
    return response.data.results;
  },

  async getUserDetails(userId: string): Promise<UserSearchResult> {
    const response = await api.get<{ result: UserSearchResult }>(`/user-management/${userId}/details`);
    return response.data.result;
  },

  async assignManager(userId: string, managerId: string): Promise<User> {
    const response = await api.post<{ user: User }>(`/user-management/${userId}/assign-manager`, { managerId });
    return response.data.user;
  },

  async assignHRBP(userId: string, hrbpId: string): Promise<User> {
    const response = await api.post<{ user: User }>(`/user-management/${userId}/assign-hrbp`, { hrbpId });
    return response.data.user;
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const response = await api.put<{ user: User }>(`/user-management/${userId}/profile`, updates);
    return response.data.user;
  },

  async deactivateUser(userId: string): Promise<User> {
    const response = await api.post<{ user: User }>(`/user-management/${userId}/deactivate`);
    return response.data.user;
  },

  async bulkAssignManager(userIds: string[], managerId: string): Promise<BulkOperationResult> {
    const response = await api.post<{ result: BulkOperationResult }>('/user-management/bulk/assign-manager', {
      userIds,
      managerId,
    });
    return response.data.result;
  },

  async bulkAssignHRBP(userIds: string[], hrbpId: string): Promise<BulkOperationResult> {
    const response = await api.post<{ result: BulkOperationResult }>('/user-management/bulk/assign-hrbp', {
      userIds,
      hrbpId,
    });
    return response.data.result;
  },

  async bulkDeactivate(userIds: string[]): Promise<BulkOperationResult> {
    const response = await api.post<{ result: BulkOperationResult }>('/user-management/bulk/deactivate', {
      userIds,
    });
    return response.data.result;
  },

  async getManagerLoadDistribution(): Promise<Array<{ manager: User; employeeCount: number }>> {
    const response = await api.get<{ distribution: Array<{ manager: User; employeeCount: number }> }>(
      '/user-management/manager-load'
    );
    return response.data.distribution;
  },

  async getHierarchyHealth(): Promise<{
    totalUsers: number;
    usersWithManager: number;
    usersWithHRBP: number;
    missingManager: number;
    missingHRBP: number;
    circularReporting: number;
    selfReporting: number;
  }> {
    const response = await api.get<{ health: any }>('/user-management/hierarchy-health');
    return response.data.health;
  },
};

