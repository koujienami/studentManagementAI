import apiClient from '@/lib/api/client';
import type {
  HearingAnswerRow,
  PaginatedResponse,
  StudentDetail,
  StudentInput,
  StudentListItem,
  StudentStatus,
} from '@/types';

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

export async function fetchActiveHearingToken(studentId: number): Promise<string | null> {
  const response = await apiClient.get<{ token: string }>(`/students/${studentId}/hearing-tokens`, {
    validateStatus: (status) => status === 200 || status === 204,
  });
  if (response.status === 204 || !response.data?.token) {
    return null;
  }
  return response.data.token;
}

export async function rotateHearingToken(studentId: number): Promise<string> {
  const response = await apiClient.post<{ token: string }>(`/students/${studentId}/hearing-tokens`);
  return response.data.token;
}

export async function fetchHearingAnswers(studentId: number): Promise<HearingAnswerRow[]> {
  const response = await apiClient.get<HearingAnswerRow[]>(`/students/${studentId}/hearing-answers`);
  return response.data;
}
