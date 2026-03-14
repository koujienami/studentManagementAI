package com.student.management.dto.student;

import com.student.management.entity.StudentPaymentSummary;

import java.time.LocalDate;

public record StudentPaymentSummaryResponse(
        Long id,
        Long enrollmentId,
        String courseName,
        Integer amount,
        LocalDate dueDate,
        LocalDate paidDate,
        String status
) {
    public static StudentPaymentSummaryResponse from(StudentPaymentSummary payment) {
        return new StudentPaymentSummaryResponse(
                payment.getId(),
                payment.getEnrollmentId(),
                payment.getCourseName(),
                payment.getAmount(),
                payment.getDueDate(),
                payment.getPaidDate(),
                payment.getStatus()
        );
    }
}
