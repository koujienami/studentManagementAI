import apiClient from '@/lib/api/client';
import type { HearingSession } from '@/types';

export interface HearingAnswerItemPayload {
  hearingItemId: number;
  answer: string;
}

export async function fetchHearingSession(token: string) {
  const response = await apiClient.get<HearingSession>(`/hearing/${token}`);
  return response.data;
}

export async function submitHearingAnswers(token: string, answers: HearingAnswerItemPayload[]) {
  await apiClient.post(`/hearing/${token}/answers`, { answers });
}
