package com.student.management.dto.dashboard;

public record DashboardStatsResponse(
        long studentCount,
        long activeEnrollmentCount,
        long unpaidPaymentCount,
        long courseCount
) {}
