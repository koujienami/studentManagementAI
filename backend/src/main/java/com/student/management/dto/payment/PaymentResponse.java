package com.student.management.dto.payment;

import com.student.management.entity.PaymentRow;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long studentId,
        String studentName,
        Long enrollmentId,
        Long courseId,
        String courseName,
        Integer amount,
        LocalDate dueDate,
        LocalDate paidDate,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PaymentResponse from(PaymentRow row) {
        return new PaymentResponse(
                row.getId(),
                row.getStudentId(),
                row.getStudentName(),
                row.getEnrollmentId(),
                row.getCourseId(),
                row.getCourseName(),
                row.getAmount(),
                row.getDueDate(),
                row.getPaidDate(),
                row.getStatus(),
                row.getCreatedAt(),
                row.getUpdatedAt()
        );
    }
}
