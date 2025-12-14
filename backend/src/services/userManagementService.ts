import { db } from '../utils/database.js';
import { User, PIP } from '../types/index.js';
import { hashPassword } from '../utils/auth.js';

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

export class UserManagementService {
  async searchUsers(filters: UserSearchFilters): Promise<UserSearchResult[]> {
    let users = await db.read<User>('users');
    const pips = await db.read<PIP>('pips');

    // Apply filters
    if (filters.userName) {
      const searchTerm = filters.userName.toLowerCase();
      users = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.userId) {
      users = users.filter(u =>
        u.id.toLowerCase().includes(filters.userId!.toLowerCase()) ||
        u.email.toLowerCase().includes(filters.userId!.toLowerCase())
      );
    }

    if (filters.managerId) {
      users = users.filter(u => u.managerId === filters.managerId);
    }

    if (filters.managerName) {
      const managerUsers = await db.find<User>('users', u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(filters.managerName!.toLowerCase())
      );
      const managerIds = new Set(managerUsers.map(m => m.id));
      users = users.filter(u => u.managerId && managerIds.has(u.managerId));
    }

    if (filters.hrbpId) {
      users = users.filter(u => u.hrbpId === filters.hrbpId);
    }

    if (filters.hrbpName) {
      const hrbpUsers = await db.find<User>('users', u =>
        u.role === 'hrbp' &&
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(filters.hrbpName!.toLowerCase())
      );
      const hrbpIds = new Set(hrbpUsers.map(h => h.id));
      users = users.filter(u => u.hrbpId && hrbpIds.has(u.hrbpId));
    }

    if (filters.department) {
      users = users.filter(u => u.department?.toLowerCase().includes(filters.department!.toLowerCase()));
    }

    if (filters.role) {
      users = users.filter(u => u.role === filters.role);
    }

    if (filters.status) {
      if (filters.status === 'active') {
        users = users.filter(u => u.isActive);
      } else if (filters.status === 'inactive') {
        users = users.filter(u => !u.isActive);
      } else if (filters.status === 'on_pip') {
        const activePipEmployeeIds = new Set(
          pips.filter(p => p.status === 'active').map(p => p.employeeId)
        );
        users = users.filter(u => activePipEmployeeIds.has(u.id));
      } else if (filters.status === 'completed_pip') {
        const completedPipEmployeeIds = new Set(
          pips.filter(p => p.status === 'completed').map(p => p.employeeId)
        );
        users = users.filter(u => completedPipEmployeeIds.has(u.id));
      }
    }

    if (filters.missingManager) {
      users = users.filter(u => !u.managerId);
    }

    if (filters.missingHrbp) {
      users = users.filter(u => !u.hrbpId);
    }

    if (filters.dateFrom) {
      users = users.filter(u => new Date(u.createdAt) >= new Date(filters.dateFrom!));
    }

    if (filters.dateTo) {
      users = users.filter(u => new Date(u.createdAt) <= new Date(filters.dateTo!));
    }

    // Build search results with relationships
    const allUsers = await db.read<User>('users');
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    return users.map(user => {
      const manager = user.managerId ? userMap.get(user.managerId) : undefined;
      const hrbp = user.hrbpId ? userMap.get(user.hrbpId) : undefined;
      
      const userPips = pips.filter(p => p.employeeId === user.id);
      const activePips = userPips.filter(p => p.status === 'active');
      const completedPips = userPips.filter(p => p.status === 'completed');

      return {
        user,
        manager,
        hrbp,
        pipCount: userPips.length,
        activePipCount: activePips.length,
        completedPipCount: completedPips.length,
      };
    });
  }

  async assignManager(userId: string, managerId: string): Promise<User | null> {
    const user = await db.findById<User>('users', userId);
    const manager = await db.findById<User>('users', managerId);

    if (!user) throw new Error('User not found');
    if (!manager) throw new Error('Manager not found');
    if (!manager.isActive) throw new Error('Manager is not active');
    if (userId === managerId) throw new Error('User cannot be their own manager');
    if (user.managerId === managerId) throw new Error('User already has this manager');

    // Check for circular reporting
    let currentManagerId = manager.managerId;
    while (currentManagerId) {
      if (currentManagerId === userId) {
        throw new Error('Circular reporting detected');
      }
      const currentManager = await db.findById<User>('users', currentManagerId);
      currentManagerId = currentManager?.managerId;
    }

    return await db.update<User>('users', userId, {
      managerId,
      updatedAt: new Date().toISOString(),
    });
  }

  async assignHRBP(userId: string, hrbpId: string): Promise<User | null> {
    const user = await db.findById<User>('users', userId);
    const hrbp = await db.findById<User>('users', hrbpId);

    if (!user) throw new Error('User not found');
    if (!hrbp) throw new Error('HRBP not found');
    if (hrbp.role !== 'hrbp') throw new Error('Assigned user is not an HRBP');
    if (!hrbp.isActive) throw new Error('HRBP is not active');

    return await db.update<User>('users', userId, {
      hrbpId,
      updatedAt: new Date().toISOString(),
    });
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = await db.findById<User>('users', userId);
    if (!user) throw new Error('User not found');

    // Validate manager assignment if provided
    if (updates.managerId && updates.managerId !== user.managerId) {
      await this.assignManager(userId, updates.managerId);
    }

    // Validate HRBP assignment if provided
    if (updates.hrbpId && updates.hrbpId !== user.hrbpId) {
      await this.assignHRBP(userId, updates.hrbpId);
    }

    // Update password if provided
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    return await db.update<User>('users', userId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async deactivateUser(userId: string): Promise<User | null> {
    return await db.update<User>('users', userId, {
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
  }

  async bulkAssignManager(userIds: string[], managerId: string): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processed: userIds.length,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    for (const userId of userIds) {
      try {
        await this.assignManager(userId, managerId);
        result.succeeded++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({ userId, error: error.message });
      }
    }

    return result;
  }

  async bulkAssignHRBP(userIds: string[], hrbpId: string): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processed: userIds.length,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    for (const userId of userIds) {
      try {
        await this.assignHRBP(userId, hrbpId);
        result.succeeded++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({ userId, error: error.message });
      }
    }

    return result;
  }

  async bulkDeactivate(userIds: string[]): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processed: userIds.length,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    for (const userId of userIds) {
      try {
        await this.deactivateUser(userId);
        result.succeeded++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({ userId, error: error.message });
      }
    }

    return result;
  }

  async getManagerLoadDistribution(): Promise<Array<{ manager: User; employeeCount: number }>> {
    const users = await db.read<User>('users');
    const managers = users.filter(u => u.role === 'manager' && u.isActive);
    
    return managers.map(manager => ({
      manager,
      employeeCount: users.filter(u => u.managerId === manager.id && u.isActive).length,
    })).sort((a, b) => b.employeeCount - a.employeeCount);
  }

  async getUserHierarchyHealth(): Promise<{
    totalUsers: number;
    usersWithManager: number;
    usersWithHRBP: number;
    missingManager: number;
    missingHRBP: number;
    circularReporting: number;
    selfReporting: number;
  }> {
    const users = await db.read<User>('users');
    const activeUsers = users.filter(u => u.isActive);

    let circularReporting = 0;
    let selfReporting = 0;

    for (const user of activeUsers) {
      if (user.managerId === user.id) {
        selfReporting++;
      }

      // Check for circular reporting
      let currentManagerId = user.managerId;
      const visited = new Set<string>([user.id]);
      while (currentManagerId) {
        if (visited.has(currentManagerId)) {
          circularReporting++;
          break;
        }
        visited.add(currentManagerId);
        const manager = users.find(u => u.id === currentManagerId);
        currentManagerId = manager?.managerId;
      }
    }

    return {
      totalUsers: activeUsers.length,
      usersWithManager: activeUsers.filter(u => u.managerId).length,
      usersWithHRBP: activeUsers.filter(u => u.hrbpId).length,
      missingManager: activeUsers.filter(u => !u.managerId).length,
      missingHRBP: activeUsers.filter(u => !u.hrbpId).length,
      circularReporting,
      selfReporting,
    };
  }
}

export const userManagementService = new UserManagementService();

