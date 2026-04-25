package com.student.management.dto.analytics;

public record CourseStatItem(
        Long id,
        String name,
        long enrollmentCount,
        long revenuePaid,
        long revenueUnpaid
) {
}
