import apiClient from '@/lib/api/client';

export interface DashboardStats {
  studentCount: number;
  activeEnrollmentCount: number;
  unpaidPaymentCount: number;
  courseCount: number;
}

export async function fetchDashboardStats() {
  const response = await apiClient.get<DashboardStats>('/dashboard/stats');
  return response.data;
}
