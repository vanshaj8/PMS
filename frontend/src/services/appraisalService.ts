import api from './api';
import { AppraisalCycle, AppraisalParticipant, AppraisalOutcome } from '../types';

export const appraisalService = {
  async getCycles(): Promise<AppraisalCycle[]> {
    const response = await api.get<AppraisalCycle[]>('/appraisals/cycles');
    return response.data;
  },

  async getActiveCycles(): Promise<AppraisalCycle[]> {
    const response = await api.get<AppraisalCycle[]>('/appraisals/cycles/active');
    return response.data;
  },

  async getCycle(id: string): Promise<AppraisalCycle> {
    const response = await api.get<AppraisalCycle>(`/appraisals/cycles/${id}`);
    return response.data;
  },

  async getCycleParticipants(cycleId: string): Promise<AppraisalParticipant[]> {
    const response = await api.get<AppraisalParticipant[]>(`/appraisals/cycles/${cycleId}/participants`);
    return response.data;
  },

  async getParticipant(id: string): Promise<AppraisalParticipant> {
    const response = await api.get<AppraisalParticipant>(`/appraisals/participants/${id}`);
    return response.data;
  },

  async getOutcome(participantId: string): Promise<AppraisalOutcome | null> {
    try {
      const response = await api.get<AppraisalOutcome>(`/appraisals/participants/${participantId}/outcome`);
      return response.data;
    } catch {
      return null;
    }
  },
};

