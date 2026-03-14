import axios from 'axios';
import type { ApiError } from '@/types';

export function getApiErrorMessage(error: unknown, fallback = 'エラーが発生しました') {
  if (axios.isAxiosError<ApiError>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getApiValidationErrors(error: unknown) {
  if (axios.isAxiosError<ApiError>(error)) {
    return error.response?.data?.details ?? {};
  }

  return {};
}
