import { ParsedRow } from './fileParserService.js';
import { db } from '../utils/database.js';
import { User } from '../types/index.js';

export interface ValidationRule {
  field: string;
  required: boolean;
  type?: 'string' | 'number' | 'email';
  maxLength?: number;
  pattern?: RegExp;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    rowNumber: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    rowNumber: number;
    field: string;
    message: string;
  }>;
}

export class DataValidationService {
  private requiredFields = ['userid', 'username', 'managerid', 'managername', 'hrbpid', 'hrbpname'];
  private fieldMappings: Record<string, string> = {
    'user_id': 'userid',
    'userid': 'userid',
    'employee_id': 'userid',
    'user_name': 'username',
    'username': 'username',
    'name': 'username',
    'manager_id': 'managerid',
    'managerid': 'managerid',
    'manager_name': 'managername',
    'managername': 'managername',
    'hrbp_id': 'hrbpid',
    'hrbpid': 'hrbpid',
    'hrbp_name': 'hrbpname',
    'hrbpname': 'hrbpname',
  };

  async validateRows(rows: ParsedRow[]): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];
    const userMap = new Map<string, ParsedRow>();
    const managerIds = new Set<string>();
    const hrbpIds = new Set<string>();

    // First pass: collect all IDs and check for duplicates
    for (const row of rows) {
      const userId = this.getFieldValue(row.data, 'userid');
      if (userId) {
        if (userMap.has(userId)) {
          errors.push({
            rowNumber: row.rowNumber,
            field: 'userid',
            message: `Duplicate User ID: ${userId}`,
          });
        } else {
          userMap.set(userId, row);
        }
      }

      const managerId = this.getFieldValue(row.data, 'managerid');
      if (managerId) managerIds.add(managerId);

      const hrbpId = this.getFieldValue(row.data, 'hrbpid');
      if (hrbpId) hrbpIds.add(hrbpId);
    }

    // Second pass: validate each row
    for (const row of rows) {
      // Check required fields
      for (const field of this.requiredFields) {
        const value = this.getFieldValue(row.data, field);
        if (!value || value.toString().trim() === '') {
          errors.push({
            rowNumber: row.rowNumber,
            field,
            message: `Missing required field: ${field}`,
          });
        }
      }

      // Check self-reporting
      const userId = this.getFieldValue(row.data, 'userid');
      const managerId = this.getFieldValue(row.data, 'managerid');
      if (userId && managerId && userId === managerId) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'managerid',
          message: 'User cannot report to themselves',
        });
      }

      // Check circular reporting (basic check)
      if (userId && managerId) {
        const managerRow = userMap.get(managerId);
        if (managerRow) {
          const managerManagerId = this.getFieldValue(managerRow.data, 'managerid');
          if (managerManagerId === userId) {
            errors.push({
              rowNumber: row.rowNumber,
              field: 'managerid',
              message: 'Circular reporting detected',
            });
          }
        }
      }

      // Format validations
      const email = this.getFieldValue(row.data, 'email');
      if (email && !this.isValidEmail(email)) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'email',
          message: 'Invalid email format',
        });
      }

      // Check referential integrity (manager exists in file)
      if (managerId && !userMap.has(managerId)) {
        warnings.push({
          rowNumber: row.rowNumber,
          field: 'managerid',
          message: `Manager ID ${managerId} not found in file`,
        });
      }

      // Check referential integrity (HRBP exists in file)
      const hrbpId = this.getFieldValue(row.data, 'hrbpid');
      if (hrbpId && !userMap.has(hrbpId) && !hrbpIds.has(hrbpId)) {
        warnings.push({
          rowNumber: row.rowNumber,
          field: 'hrbpid',
          message: `HRBP ID ${hrbpId} not found in file`,
        });
      }
    }

    // Check for orphan managers (managers not mapped to any employee)
    for (const managerId of managerIds) {
      if (!userMap.has(managerId)) {
        warnings.push({
          rowNumber: 0,
          field: 'managerid',
          message: `Orphan manager: ${managerId} is not an employee`,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private getFieldValue(data: Record<string, any>, field: string): string | null {
    // Try direct match
    if (data[field]) return String(data[field]).trim();
    
    // Try mapped field
    const mappedField = this.fieldMappings[field];
    if (mappedField && data[mappedField]) {
      return String(data[mappedField]).trim();
    }

    // Try case-insensitive match
    for (const key of Object.keys(data)) {
      if (key.toLowerCase() === field.toLowerCase()) {
        return data[key] ? String(data[key]).trim() : null;
      }
    }

    return null;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async validateAgainstDatabase(rows: ParsedRow[]): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];
    
    const existingUsers = await db.read<User>('users');
    const existingUserMap = new Map(existingUsers.map(u => [u.id.toLowerCase(), u]));

    for (const row of rows) {
      const userId = this.getFieldValue(row.data, 'userid');
      const managerId = this.getFieldValue(row.data, 'managerid');
      const hrbpId = this.getFieldValue(row.data, 'hrbpid');

      // Check if manager exists in database
      if (managerId) {
        const managerExists = Array.from(existingUserMap.values()).some(
          u => u.id.toLowerCase() === managerId.toLowerCase() || 
               u.email.toLowerCase() === managerId.toLowerCase()
        );
        if (!managerExists && !rows.some(r => this.getFieldValue(r.data, 'userid') === managerId)) {
          warnings.push({
            rowNumber: row.rowNumber,
            field: 'managerid',
            message: `Manager ${managerId} not found in database or import file`,
          });
        }
      }

      // Check if HRBP exists in database
      if (hrbpId) {
        const hrbpExists = Array.from(existingUserMap.values()).some(
          u => u.id.toLowerCase() === hrbpId.toLowerCase() || 
               u.email.toLowerCase() === hrbpId.toLowerCase() ||
               u.role === 'hrbp'
        );
        if (!hrbpExists && !rows.some(r => this.getFieldValue(r.data, 'userid') === hrbpId)) {
          warnings.push({
            rowNumber: row.rowNumber,
            field: 'hrbpid',
            message: `HRBP ${hrbpId} not found in database or import file`,
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export const dataValidationService = new DataValidationService();

