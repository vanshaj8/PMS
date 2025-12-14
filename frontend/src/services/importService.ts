import api from './api';

export interface PreviewResult {
  filename: string;
  headers: string[];
  totalRows: number;
  validation: {
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
  };
  preview: any[];
  transformedCount: number;
}

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

export interface ImportHistory {
  id: string;
  timestamp: string;
  mode: string;
  userId: string;
  filename: string;
  result: ImportResult;
}

export const importService = {
  async previewFile(file: File): Promise<PreviewResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<PreviewResult>('/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async importFile(file: File, mode: 'full' | 'delta' | 'append' = 'delta'): Promise<{ success: boolean; result: ImportResult; warnings: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    
    const response = await api.post<{ success: boolean; result: ImportResult; warnings: number }>('/import/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getImportHistory(): Promise<ImportHistory[]> {
    const response = await api.get<{ history: ImportHistory[] }>('/import/history');
    return response.data.history;
  },

  async getLastImport(): Promise<ImportHistory | null> {
    const response = await api.get<{ lastImport: ImportHistory | null }>('/import/last-import');
    return response.data.lastImport;
  },

  async rollbackImport(importId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(`/import/rollback/${importId}`);
    return response.data;
  },

  async downloadErrorReport(rows: any[], validation: any): Promise<Blob> {
    const response = await api.post('/import/error-report', { rows, validation }, {
      responseType: 'blob',
    });
    return response.data;
  },
};

