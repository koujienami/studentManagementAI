import apiClient from '@/lib/api/client';
import type { ApplyCourse, ApplyInput, ApplyResult, ReferralSourceOption } from '@/types';

export async function fetchApplyCourses() {
  const response = await apiClient.get<ApplyCourse[]>('/apply/courses');
  return response.data;
}

export async function fetchApplyReferralSources() {
  const response = await apiClient.get<ReferralSourceOption[]>('/apply/referral-sources');
  return response.data;
}

export async function submitApplication(input: ApplyInput) {
  const response = await apiClient.post<ApplyResult>('/apply', input);
  return response.data;
}
