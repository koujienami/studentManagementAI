import apiClient from '@/lib/api/client';
import type {
  AnalyticsOverview,
  CourseStatItem,
  MonthlyStatItem,
  PaymentSummary,
  ReferralSourceStatItem,
} from '@/types';

export interface DateRangeParams {
  from?: string;
  to?: string;
}

function buildParams(params: DateRangeParams) {
  const search: Record<string, string> = {};
  if (params.from) search.from = params.from;
  if (params.to) search.to = params.to;
  return search;
}

export async function fetchAnalyticsOverview(params: DateRangeParams = {}) {
  const response = await apiClient.get<AnalyticsOverview>('/analytics/overview', {
    params: buildParams(params),
  });
  return response.data;
}

export async function fetchAnalyticsReferralSources(params: DateRangeParams = {}) {
  const response = await apiClient.get<ReferralSourceStatItem[]>(
    '/analytics/referral-sources',
    { params: buildParams(params) },
  );
  return response.data;
}

export async function fetchAnalyticsCourses(params: DateRangeParams = {}) {
  const response = await apiClient.get<CourseStatItem[]>('/analytics/courses', {
    params: buildParams(params),
  });
  return response.data;
}

export async function fetchAnalyticsMonthly(months = 12) {
  const response = await apiClient.get<MonthlyStatItem[]>('/analytics/monthly', {
    params: { months },
  });
  return response.data;
}

export async function fetchAnalyticsPaymentSummary(params: DateRangeParams = {}) {
  const response = await apiClient.get<PaymentSummary>('/analytics/payments/summary', {
    params: buildParams(params),
  });
  return response.data;
}
