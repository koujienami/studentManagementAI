package com.student.management.dto.analytics;

public record AnalyticsOverviewResponse(
        long newStudents,
        long activeEnrollments,
        PaymentSummary payments
) {
}
