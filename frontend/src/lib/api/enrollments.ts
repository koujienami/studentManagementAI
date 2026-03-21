import apiClient from '@/lib/api/client';
import type { EnrollmentListItem, EnrollmentStatus, PaginatedResponse } from '@/types';

export interface EnrollmentListParams {
  studentId?: number | null;
  courseId?: number | null;
  status?: EnrollmentStatus | '';
  page?: number;
  size?: number;
}

export interface CreateEnrollmentInput {
  studentId: number;
  courseId: number;
  startDate: string;
  endDate?: string | null;
  status?: EnrollmentStatus;
  amount?: number | null;
  dueDate: string;
}

export interface UpdateEnrollmentInput {
  startDate: string;
  endDate?: string | null;
  status: EnrollmentStatus;
}

export async function fetchEnrollments(params: EnrollmentListParams = {}) {
  const response = await apiClient.get<PaginatedResponse<EnrollmentListItem>>('/enrollments', {
    params: {
      studentId: params.studentId ?? undefined,
      courseId: params.courseId ?? undefined,
      status: params.status || undefined,
      page: params.page ?? undefined,
      size: params.size ?? undefined,
    },
  });
  return response.data;
}

export async function fetchEnrollment(id: number) {
  const response = await apiClient.get<EnrollmentListItem>(`/enrollments/${id}`);
  return response.data;
}

export async function createEnrollment(input: CreateEnrollmentInput) {
  const response = await apiClient.post<EnrollmentListItem>('/enrollments', input);
  return response.data;
}

export async function updateEnrollment(id: number, input: UpdateEnrollmentInput) {
  const response = await apiClient.put<EnrollmentListItem>(`/enrollments/${id}`, input);
  return response.data;
}
