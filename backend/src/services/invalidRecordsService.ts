import { db } from '../utils/database.js';
import { ParsedRow } from './fileParserService.js';
import { v4 as uuidv4 } from 'uuid';

export interface InvalidRecord {
  id: string;
  batchId: string;
  rowNumber: number;
  data: Record<string, any>;
  errors: Array<{
    field: string;
    message: string;
  }>;
  status: 'pending' | 'corrected' | 'processed';
  correctedData?: Record<string, any>;
  correctedBy?: string;
  correctedAt?: string;
  createdAt: string;
}

export class InvalidRecordsService {
  async saveInvalidRecords(
    batchId: string,
    rows: ParsedRow[],
    errors: Array<{ rowNumber: number; field: string; message: string }>
  ): Promise<void> {
    const errorMap = new Map<number, Array<{ field: string; message: string }>>();
    
    errors.forEach(error => {
      if (!errorMap.has(error.rowNumber)) {
        errorMap.set(error.rowNumber, []);
      }
      errorMap.get(error.rowNumber)!.push({ field: error.field, message: error.message });
    });

    const invalidRecords: InvalidRecord[] = rows
      .filter(row => errorMap.has(row.rowNumber))
      .map(row => ({
        id: uuidv4(),
        batchId,
        rowNumber: row.rowNumber,
        data: row.data,
        errors: errorMap.get(row.rowNumber) || [],
        status: 'pending',
        createdAt: new Date().toISOString(),
      }));

    const existing = await db.read<InvalidRecord>('invalidRecords');
    existing.push(...invalidRecords);
    await db.write('invalidRecords', existing);
  }

  async getInvalidRecords(batchId?: string, status?: InvalidRecord['status']): Promise<InvalidRecord[]> {
    let records = await db.read<InvalidRecord>('invalidRecords');
    
    if (batchId) {
      records = records.filter(r => r.batchId === batchId);
    }
    
    if (status) {
      records = records.filter(r => r.status === status);
    }

    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async correctRecord(
    recordId: string,
    correctedData: Record<string, any>,
    correctedBy: string
  ): Promise<InvalidRecord | null> {
    const record = await db.findById<InvalidRecord>('invalidRecords', recordId);
    if (!record) return null;

    return await db.update<InvalidRecord>('invalidRecords', recordId, {
      correctedData,
      correctedBy,
      correctedAt: new Date().toISOString(),
      status: 'corrected',
    });
  }

  async processCorrectedRecord(recordId: string): Promise<InvalidRecord | null> {
    return await db.update<InvalidRecord>('invalidRecords', recordId, {
      status: 'processed',
    });
  }

  async deleteRecord(recordId: string): Promise<boolean> {
    return await db.delete('invalidRecords', recordId);
  }
}

export const invalidRecordsService = new InvalidRecordsService();

