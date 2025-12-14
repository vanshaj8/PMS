import { db } from '../utils/database.js';
import { User, PIP } from '../types/index.js';
import { TransformResult } from './dataTransformationService.js';
import { hashPassword } from '../utils/auth.js';
import { v4 as uuidv4 } from 'uuid';

export type ImportMode = 'full' | 'delta' | 'append';

export interface ImportResult {
  success: boolean;
  totalRows: number;
  created: number;
  updated: number;
  deleted: number;
  errors: number;
  warnings: number;
  importId: string;
  timestamp: string;
}

export interface ImportSnapshot {
  id: string;
  timestamp: string;
  mode: ImportMode;
  userId: string;
  filename: string;
  result: ImportResult;
  userSnapshot: User[];
  orgSnapshot: {
    managerMappings: Record<string, string>;
    hrbpMappings: Record<string, string>;
  };
}

export class ImportService {
  async importUsers(
    transformedData: TransformResult,
    mode: ImportMode,
    userId: string,
    filename: string
  ): Promise<ImportResult> {
    const importId = uuidv4();
    const timestamp = new Date().toISOString();
    const existingUsers = await db.read<User>('users');
    const existingUserMap = new Map(existingUsers.map(u => [u.id.toLowerCase(), u]));

    let created = 0;
    let updated = 0;
    let deleted = 0;
    const errors: string[] = [];

    // Create snapshot before import
    const snapshot: ImportSnapshot = {
      id: importId,
      timestamp,
      mode,
      userId,
      filename,
      result: {
        success: false,
        totalRows: transformedData.users.length,
        created: 0,
        updated: 0,
        deleted: 0,
        errors: 0,
        warnings: 0,
        importId,
        timestamp,
      },
      userSnapshot: JSON.parse(JSON.stringify(existingUsers)),
      orgSnapshot: {
        managerMappings: {},
        hrbpMappings: {},
      },
    };

    try {
      if (mode === 'full') {
        // Full load: delete all and recreate
        await db.write('users', []);
        for (const user of transformedData.users) {
          user.password = await hashPassword('TempPassword123!'); // Default password
          await db.create('users', user);
          created++;
        }
      } else if (mode === 'delta') {
        // Delta load: update existing, create new, optionally delete missing
        const newUserIds = new Set(transformedData.users.map(u => u.id.toLowerCase()));
        
        for (const user of transformedData.users) {
          const existing = existingUserMap.get(user.id.toLowerCase());
          if (existing) {
            // Update existing user
            const updatedUser = {
              ...existing,
              ...user,
              password: existing.password, // Keep existing password
              updatedAt: timestamp,
            };
            await db.update('users', existing.id, updatedUser);
            updated++;
          } else {
            // Create new user
            user.password = await hashPassword('TempPassword123!');
            await db.create('users', user);
            created++;
          }
        }

        // Optionally delete users not in import (commented out for safety)
        // for (const existingUser of existingUsers) {
        //   if (!newUserIds.has(existingUser.id.toLowerCase())) {
        //     await db.delete('users', existingUser.id);
        //     deleted++;
        //   }
        // }
      } else if (mode === 'append') {
        // Append mode: only add new users
        for (const user of transformedData.users) {
          const existing = existingUserMap.get(user.id.toLowerCase());
          if (!existing) {
            user.password = await hashPassword('TempPassword123!');
            await db.create('users', user);
            created++;
          } else {
            errors.push(`User ${user.id} already exists (skipped)`);
          }
        }
      }

      // Update PIPs affected by org changes
      await this.updateAffectedPIPs(transformedData);

      snapshot.result = {
        success: true,
        totalRows: transformedData.users.length,
        created,
        updated,
        deleted,
        errors: errors.length,
        warnings: 0,
        importId,
        timestamp,
      };

      // Save snapshot for rollback
      const snapshots = await db.read<ImportSnapshot>('importSnapshots');
      snapshots.push(snapshot);
      await db.write('importSnapshots', snapshots);

      return snapshot.result;
    } catch (error: any) {
      snapshot.result.errors = errors.length + 1;
      snapshot.result.success = false;
      throw error;
    }
  }

  private async updateAffectedPIPs(transformedData: TransformResult): Promise<void> {
    const pips = await db.read<PIP>('pips');
    const userMap = new Map(transformedData.users.map(u => [u.id, u]));

    for (const pip of pips) {
      let updated = false;

      // Check if manager changed
      const newManager = userMap.get(pip.managerId);
      if (newManager && newManager.managerId !== pip.managerId) {
        pip.managerId = newManager.id;
        updated = true;
      }

      // Check if HRBP changed
      const newHrbp = userMap.get(pip.hrbpId);
      if (newHrbp && newHrbp.hrbpId !== pip.hrbpId) {
        pip.hrbpId = newHrbp.id;
        updated = true;
      }

      // Check if employee changed
      const newEmployee = userMap.get(pip.employeeId);
      if (newEmployee) {
        pip.employeeId = newEmployee.id;
        updated = true;
      }

      if (updated && !pip.locked) {
        await db.update('pips', pip.id, {
          ...pip,
          version: pip.version + 1,
        });
      }
    }
  }

  async rollbackImport(importId: string): Promise<boolean> {
    const snapshots = await db.read<ImportSnapshot>('importSnapshots');
    const snapshot = snapshots.find(s => s.id === importId);

    if (!snapshot) {
      throw new Error('Import snapshot not found');
    }

    // Restore users
    await db.write('users', snapshot.userSnapshot);

    // Restore PIPs (would need PIP snapshots for full rollback)
    // For now, we'll just mark the import as rolled back

    snapshot.result.success = false;
    await db.write('importSnapshots', snapshots);

    return true;
  }

  async getImportHistory(): Promise<ImportSnapshot[]> {
    return await db.read<ImportSnapshot>('importSnapshots');
  }

  async getLastImport(): Promise<ImportSnapshot | null> {
    const snapshots = await db.read<ImportSnapshot>('importSnapshots');
    return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  }
}

export const importService = new ImportService();

