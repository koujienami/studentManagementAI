import apiClient from '@/lib/api/client';
import type {
  MemberCreateInput,
  MemberDetail,
  MemberListItem,
  MemberUpdateInput,
  Role,
} from '@/types';

interface MemberListParams {
  keyword?: string;
  role?: Role | '';
}

export async function fetchMembers(params: MemberListParams = {}) {
  const response = await apiClient.get<MemberListItem[]>('/users', {
    params: {
      keyword: params.keyword || undefined,
      role: params.role || undefined,
    },
  });
  return response.data;
}

export async function fetchMember(id: number) {
  const response = await apiClient.get<MemberDetail>(`/users/${id}`);
  return response.data;
}

export async function createMember(input: MemberCreateInput) {
  const response = await apiClient.post<MemberDetail>('/users', input);
  return response.data;
}

export async function updateMember(id: number, input: MemberUpdateInput) {
  const response = await apiClient.put<MemberDetail>(`/users/${id}`, input);
  return response.data;
}

export async function deleteMember(id: number) {
  await apiClient.delete(`/users/${id}`);
}

export async function resetMemberPassword(id: number, newPassword: string) {
  await apiClient.post(`/users/${id}/password-reset`, { newPassword });
}

export async function changeMyPassword(currentPassword: string, newPassword: string) {
  await apiClient.post('/auth/password', { currentPassword, newPassword });
}
