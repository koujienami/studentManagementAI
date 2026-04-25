package com.student.management.dto.analytics;

public record ReferralSourceStatItem(
        Long id,
        String name,
        String category,
        long studentCount
) {
}
