package com.student.management.dto.enrollment;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EnrollmentRequest(
        @NotNull(message = "受講生は必須です")
        Long studentId,

        @NotNull(message = "コースは必須です")
        Long courseId,

        @NotNull(message = "受講開始日は必須です")
        LocalDate startDate,

        LocalDate endDate,

        /**
         * 省略時は ENROLLED（申込フローと同様）
         */
        String status,

        /**
         * 省略時はコース料金を使用
         */
        Integer amount,

        @NotNull(message = "決済期日は必須です")
        LocalDate dueDate
) {
}
