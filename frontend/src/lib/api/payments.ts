import apiClient from '@/lib/api/client';
import type { PaginatedResponse, PaymentListItem, PaymentStatus } from '@/types';

export interface PaymentListParams {
  studentId?: number | null;
  courseId?: number | null;
  status?: PaymentStatus | '';
  page?: number;
  size?: number;
}

export interface UpdatePaymentInput {
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: PaymentStatus;
}

export async function fetchPayments(params: PaymentListParams = {}) {
  const response = await apiClient.get<PaginatedResponse<PaymentListItem>>('/payments', {
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

export async function fetchPayment(id: number) {
  const response = await apiClient.get<PaymentListItem>(`/payments/${id}`);
  return response.data;
}

export async function updatePayment(id: number, input: UpdatePaymentInput) {
  const response = await apiClient.put<PaymentListItem>(`/payments/${id}`, input);
  return response.data;
}
