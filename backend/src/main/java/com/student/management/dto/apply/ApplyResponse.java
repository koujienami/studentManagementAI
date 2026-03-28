package com.student.management.dto.apply;

import java.time.LocalDate;

public record ApplyResponse(
        Long studentId,
        Long enrollmentId,
        Long paymentId,
        String courseName,
        Integer amount,
        LocalDate paymentDueDate
) {
}
