package com.student.management.dto.analytics;

public record MonthlyStatItem(
        String month,
        long newStudents,
        long paidAmount,
        long unpaidAmount
) {
}
