import { ParsedRow } from './fileParserService.js';
import { User, UserRole } from '../types/index.js';
import { db } from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export interface TransformResult {
  users: User[];
  mappings: {
    oldUserId: string;
    newUserId: string;
  }[];
  managerMappings: Map<string, string>; // oldId -> newId
  hrbpMappings: Map<string, string>; // oldId -> newId
}

export class DataTransformationService {
  async transformRows(rows: ParsedRow[]): Promise<TransformResult> {
    const users: User[] = [];
    const mappings: TransformResult['mappings'] = [];
    const managerMappings = new Map<string, string>();
    const hrbpMappings = new Map<string, string>();

    // First pass: create user objects
    for (const row of rows) {
      const userId = this.getFieldValue(row.data, 'userid') || uuidv4();
      const userName = this.getFieldValue(row.data, 'username') || '';
      const [firstName, ...lastNameParts] = userName.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      const email = this.getFieldValue(row.data, 'email') || 
                   `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`;

      const user: User = {
        id: userId.toLowerCase(),
        email: email.toLowerCase(),
        password: '', // Will be set during import
        firstName: this.toProperCase(firstName),
        lastName: this.toProperCase(lastName),
        role: this.determineRole(row.data),
        department: this.getFieldValue(row.data, 'department') || undefined,
        location: this.getFieldValue(row.data, 'location') || undefined,
        managerId: this.getFieldValue(row.data, 'managerid')?.toLowerCase() || undefined,
        hrbpId: this.getFieldValue(row.data, 'hrbpid')?.toLowerCase() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      users.push(user);
      mappings.push({
        oldUserId: userId,
        newUserId: user.id,
      });
    }

    // Second pass: resolve manager and HRBP IDs
    const userMap = new Map(users.map(u => [u.id, u]));
    
    for (const user of users) {
      // Resolve manager ID
      if (user.managerId) {
        const manager = userMap.get(user.managerId.toLowerCase());
        if (manager) {
          user.managerId = manager.id;
          managerMappings.set(user.managerId, manager.id);
        } else {
          // Try to find by email or name
          const foundManager = users.find(u => 
            u.email.toLowerCase() === user.managerId.toLowerCase() ||
            `${u.firstName} ${u.lastName}`.toLowerCase() === user.managerId.toLowerCase()
          );
          if (foundManager) {
            user.managerId = foundManager.id;
            managerMappings.set(user.managerId, foundManager.id);
          }
        }
      }

      // Resolve HRBP ID
      if (user.hrbpId) {
        const hrbp = userMap.get(user.hrbpId.toLowerCase());
        if (hrbp) {
          user.hrbpId = hrbp.id;
          hrbpMappings.set(user.hrbpId, hrbp.id);
        } else {
          // Try to find by email or name, or find any HRBP
          const foundHrbp = users.find(u => 
            u.role === 'hrbp' && (
              u.email.toLowerCase() === user.hrbpId.toLowerCase() ||
              `${u.firstName} ${u.lastName}`.toLowerCase() === user.hrbpId.toLowerCase()
            )
          );
          if (foundHrbp) {
            user.hrbpId = foundHrbp.id;
            hrbpMappings.set(user.hrbpId, foundHrbp.id);
          }
        }
      }
    }

    return {
      users,
      mappings,
      managerMappings,
      hrbpMappings,
    };
  }

  private getFieldValue(data: Record<string, any>, field: string): string | null {
    if (data[field]) return String(data[field]).trim();
    
    // Try case-insensitive match
    for (const key of Object.keys(data)) {
      if (key.toLowerCase() === field.toLowerCase()) {
        return data[key] ? String(data[key]).trim() : null;
      }
    }

    return null;
  }

  private toProperCase(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private determineRole(data: Record<string, any>): UserRole {
    const role = this.getFieldValue(data, 'role')?.toLowerCase();
    const grade = this.getFieldValue(data, 'grade')?.toLowerCase();

    if (role === 'manager' || role === 'admin' || grade?.includes('manager')) {
      return 'manager';
    }
    if (role === 'hrbp' || role === 'hr') {
      return 'hrbp';
    }
    if (role === 'admin' || role === 'administrator') {
      return 'admin';
    }
    if (role === 'executive' || grade?.includes('exec')) {
      return 'executive';
    }

    return 'employee';
  }
}

export const dataTransformationService = new DataTransformationService();

