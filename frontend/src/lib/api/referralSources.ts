import apiClient from '@/lib/api/client';
import type { ReferralSourceAdmin, ReferralSourceInput } from '@/types';

export async function fetchReferralSourcesAdmin() {
  const response = await apiClient.get<ReferralSourceAdmin[]>('/admin/referral-sources');
  return response.data;
}

export async function fetchReferralSourceAdmin(id: number) {
  const response = await apiClient.get<ReferralSourceAdmin>(
    `/admin/referral-sources/${id}`,
  );
  return response.data;
}

export async function createReferralSource(input: ReferralSourceInput) {
  const response = await apiClient.post<ReferralSourceAdmin>(
    '/admin/referral-sources',
    input,
  );
  return response.data;
}

export async function updateReferralSource(id: number, input: ReferralSourceInput) {
  const response = await apiClient.put<ReferralSourceAdmin>(
    `/admin/referral-sources/${id}`,
    input,
  );
  return response.data;
}

export async function deleteReferralSource(id: number) {
  await apiClient.delete(`/admin/referral-sources/${id}`);
}
