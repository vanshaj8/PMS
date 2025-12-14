import * as XLSX from 'xlsx';
import { Readable } from 'stream';

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  sheets?: string[];
}

export class FileParserService {
  async parseExcel(buffer: Buffer, filename: string): Promise<ParseResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    const firstSheet = workbook.Sheets[sheetNames[0]];
    
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
      raw: false,
      defval: null,
    }) as Record<string, any>[];

    const headers = this.detectHeaders(firstSheet);
    const rows: ParsedRow[] = jsonData.map((row, index) => ({
      rowNumber: index + 2, // +2 because index starts at 0 and we skip header row
      data: this.normalizeRow(row, headers),
      errors: [],
    }));

    return {
      headers,
      rows,
      totalRows: rows.length,
      validRows: 0,
      invalidRows: 0,
      sheets: sheetNames,
    };
  }

  async parseCSV(buffer: Buffer): Promise<ParseResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { 
      raw: false,
      defval: null,
    }) as Record<string, any>[];

    const headers = this.detectHeaders(sheet);
    const rows: ParsedRow[] = jsonData.map((row, index) => ({
      rowNumber: index + 2,
      data: this.normalizeRow(row, headers),
      errors: [],
    }));

    return {
      headers,
      rows,
      totalRows: rows.length,
      validRows: 0,
      invalidRows: 0,
    };
  }

  private detectHeaders(sheet: XLSX.WorkSheet): string[] {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    const headers: string[] = [];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = sheet[cellAddress];
      headers.push(cell ? String(cell.v || '').trim() : '');
    }
    
    return headers;
  }

  private normalizeRow(row: Record<string, any>, headers: string[]): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      const key = header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '');
      const value = row[header] ?? row[Object.keys(row)[index]] ?? null;
      
      if (value !== null && typeof value === 'string') {
        normalized[key] = value.trim();
      } else {
        normalized[key] = value;
      }
    });
    
    return normalized;
  }

  mapColumns(headers: string[], mapping: Record<string, string>): string[] {
    return headers.map(header => {
      const normalized = header.toLowerCase().replace(/\s+/g, '_');
      return mapping[normalized] || mapping[header] || header;
    });
  }
}

export const fileParserService = new FileParserService();

