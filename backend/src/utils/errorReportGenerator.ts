import * as XLSX from 'xlsx';
import { ValidationResult } from '../services/dataValidationService.js';
import { ParsedRow } from '../services/fileParserService.js';

export class ErrorReportGenerator {
  generateErrorReport(
    rows: ParsedRow[],
    validationResult: ValidationResult
  ): Buffer {
    const errorData: any[] = [];

    // Create a map of row errors
    const errorMap = new Map<number, ValidationResult['errors']>();
    validationResult.errors.forEach(error => {
      if (!errorMap.has(error.rowNumber)) {
        errorMap.set(error.rowNumber, []);
      }
      errorMap.get(error.rowNumber)!.push(error);
    });

    // Add error details to each row
    rows.forEach(row => {
      const rowErrors = errorMap.get(row.rowNumber) || [];
      const errorMessages = rowErrors.map(e => `${e.field}: ${e.message}`).join('; ');

      errorData.push({
        'Row Number': row.rowNumber,
        'User ID': row.data.userid || '',
        'User Name': row.data.username || '',
        'Manager ID': row.data.managerid || '',
        'HRBP ID': row.data.hrbpid || '',
        'Errors': errorMessages || 'Valid',
        'Error Count': rowErrors.length,
      });
    });

    // Add warnings section
    if (validationResult.warnings.length > 0) {
      validationResult.warnings.forEach(warning => {
        errorData.push({
          'Row Number': warning.rowNumber || 'N/A',
          'User ID': '',
          'User Name': '',
          'Manager ID': '',
          'HRBP ID': '',
          'Errors': `WARNING: ${warning.field} - ${warning.message}`,
          'Error Count': 0,
        });
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(errorData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors');

    // Auto-size columns
    const maxWidth = 50;
    worksheet['!cols'] = [
      { wch: 12 }, // Row Number
      { wch: 15 }, // User ID
      { wch: 20 }, // User Name
      { wch: 15 }, // Manager ID
      { wch: 15 }, // HRBP ID
      { wch: maxWidth }, // Errors
      { wch: 12 }, // Error Count
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  generateSummaryReport(validationResult: ValidationResult, totalRows: number): string {
    const summary = [
      '=== IMPORT VALIDATION SUMMARY ===',
      '',
      `Total Rows Processed: ${totalRows}`,
      `Valid Rows: ${totalRows - validationResult.errors.length}`,
      `Rows with Errors: ${validationResult.errors.length}`,
      `Warnings: ${validationResult.warnings.length}`,
      '',
      '=== ERROR BREAKDOWN ===',
    ];

    const errorByField = new Map<string, number>();
    validationResult.errors.forEach(error => {
      const count = errorByField.get(error.field) || 0;
      errorByField.set(error.field, count + 1);
    });

    errorByField.forEach((count, field) => {
      summary.push(`${field}: ${count} errors`);
    });

    if (validationResult.warnings.length > 0) {
      summary.push('');
      summary.push('=== WARNINGS ===');
      validationResult.warnings.forEach(warning => {
        summary.push(`Row ${warning.rowNumber}: ${warning.field} - ${warning.message}`);
      });
    }

    return summary.join('\n');
  }
}

export const errorReportGenerator = new ErrorReportGenerator();

