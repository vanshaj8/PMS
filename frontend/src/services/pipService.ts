import api from './api';
import { PIP, Goal, CheckIn } from '../types';

export const pipService = {
  async getAllPIPs(): Promise<PIP[]> {
    const response = await api.get<{ pips: PIP[] }>('/pips');
    return response.data.pips;
  },

  async getPIP(id: string): Promise<PIP> {
    const response = await api.get<{ pip: PIP }>(`/pips/${id}`);
    return response.data.pip;
  },

  async createPIP(data: {
    employeeId: string;
    hrbpId: string;
    reason: string;
    supportingDocuments: string[];
    goals: Omit<Goal, 'id'>[];
    timeline: any;
  }): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>('/pips', data);
    return response.data.pip;
  },

  async updateGoals(pipId: string, goals: Goal[]): Promise<PIP> {
    const response = await api.put<{ pip: PIP }>(`/pips/${pipId}/goals`, { goals });
    return response.data.pip;
  },

  async hrbpReview(pipId: string, action: 'approve' | 'deny' | 'send_back', comments?: string): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>(`/pips/${pipId}/hrbp-review`, { action, comments });
    return response.data.pip;
  },

  async acknowledgePIP(pipId: string, comments?: string): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>(`/pips/${pipId}/acknowledge`, { comments });
    return response.data.pip;
  },

  async addCheckIn(pipId: string, notes: string, attachments?: string[]): Promise<CheckIn> {
    const response = await api.post<{ checkIn: CheckIn }>(`/pips/${pipId}/checkins`, { notes, attachments });
    return response.data.checkIn;
  },

  async submitSelfReview(pipId: string, goals: Array<{ id: string; justification: string; attachments?: string[] }>): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>(`/pips/${pipId}/self-review`, { goals });
    return response.data.pip;
  },

  async submitManagerReview(
    pipId: string,
    goals: Array<{ id: string; status: 'achieved' | 'partially_achieved' | 'not_achieved'; managerComments: string }>,
    comments?: string
  ): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>(`/pips/${pipId}/manager-review`, { goals, comments });
    return response.data.pip;
  },

  async submitFinalDecision(
    pipId: string,
    outcome: 'successful' | 'unsuccessful' | 'extended' | 'closed_without_action',
    remarks: string
  ): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>(`/pips/${pipId}/final-decision`, { outcome, remarks });
    return response.data.pip;
  },

  async overrideTimeline(pipId: string, step: string, newDueDate: string, reason: string): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>(`/pips/${pipId}/timeline-override`, { step, newDueDate, reason });
    return response.data.pip;
  },

  // New deadline-related endpoints
  async approvePIPByHrbp(pipId: string): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>(`/pips/${pipId}/hrbp-approve`);
    return response.data.pip;
  },

  async deemAcknowledged(pipId: string, comments?: string): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>(`/pips/${pipId}/deem-acknowledged`, { comments });
    return response.data.pip;
  },

  async completeActivePeriod(pipId: string, forceComplete?: boolean): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>(`/pips/${pipId}/complete-active`, { forceComplete });
    return response.data.pip;
  },

  async requestExtension(pipId: string, newDuration: number, justification: string): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>(`/pips/${pipId}/extend`, { newDuration, justification });
    return response.data.pip;
  },

  async hrbpOverrideReview(pipId: string, comments?: string): Promise<PIP> {
    const response = await api.post<{ pip: PIP }>(`/pips/${pipId}/hrbp-override-review`, { comments });
    return response.data.pip;
  },

  async getDeadlinePolicy(): Promise<any> {
    const response = await api.get('/pips/deadline-policy');
    return response.data;
  },
};

