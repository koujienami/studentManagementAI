package com.student.management.dto.analytics;

public record PaymentSummary(
        long totalPaid,
        long totalUnpaid,
        long countPaid,
        long countUnpaid
) {
}
