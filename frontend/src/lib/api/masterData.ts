import apiClient from '@/lib/api/client';
import type { ReferralSourceOption, UserOption } from '@/types';

export async function fetchInstructorOptions() {
  const response = await apiClient.get<UserOption[]>('/master-data/instructors');
  return response.data;
}

export async function fetchReferralSourceOptions() {
  const response = await apiClient.get<ReferralSourceOption[]>('/referral-sources');
  return response.data;
}
