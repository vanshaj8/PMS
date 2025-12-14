import api from './api';

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

export const invalidRecordsService = {
  async getInvalidRecords(batchId?: string, status?: string): Promise<InvalidRecord[]> {
    const params = new URLSearchParams();
    if (batchId) params.append('batchId', batchId);
    if (status) params.append('status', status);
    
    const response = await api.get<{ records: InvalidRecord[] }>(
      `/invalid-records?${params.toString()}`
    );
    return response.data.records;
  },

  async correctRecord(recordId: string, correctedData: Record<string, any>): Promise<InvalidRecord> {
    const response = await api.put<{ record: InvalidRecord }>(
      `/invalid-records/${recordId}/correct`,
      { correctedData }
    );
    return response.data.record;
  },

  async processRecord(recordId: string): Promise<InvalidRecord> {
    const response = await api.post<{ record: InvalidRecord }>(`/invalid-records/${recordId}/process`);
    return response.data.record;
  },

  async deleteRecord(recordId: string): Promise<boolean> {
    const response = await api.delete<{ success: boolean }>(`/invalid-records/${recordId}`);
    return response.data.success;
  },
};

