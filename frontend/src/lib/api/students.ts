import apiClient from '@/lib/api/client';
import type { PaginatedResponse, StudentDetail, StudentInput, StudentListItem, StudentStatus } from '@/types';

export interface StudentListParams {
  keyword?: string;
  status?: StudentStatus | '';
  referralSourceId?: number | null;
  hasUnpaid?: boolean | null;
  courseId?: number | null;
  page?: number;
  size?: number;
}

export async function fetchStudents(params: StudentListParams = {}) {
  const response = await apiClient.get<PaginatedResponse<StudentListItem>>('/students', {
    params: {
      keyword: params.keyword || undefined,
      status: params.status || undefined,
      referralSourceId: params.referralSourceId ?? undefined,
      hasUnpaid: params.hasUnpaid ?? undefined,
      courseId: params.courseId ?? undefined,
      page: params.page ?? undefined,
      size: params.size ?? undefined,
    },
  });
  return response.data;
}

export async function fetchStudent(id: number) {
  const response = await apiClient.get<StudentDetail>(`/students/${id}`);
  return response.data;
}

export async function createStudent(input: StudentInput) {
  const response = await apiClient.post<StudentDetail>('/students', input);
  return response.data;
}

export async function updateStudent(id: number, input: StudentInput) {
  const response = await apiClient.put<StudentDetail>(`/students/${id}`, input);
  return response.data;
}

export async function updateStudentStatus(id: number, status: StudentStatus) {
  const response = await apiClient.patch<StudentDetail>(`/students/${id}/status`, { status });
  return response.data;
}

export async function deleteStudent(id: number) {
  await apiClient.delete(`/students/${id}`);
}
