package com.student.management.dto.enrollment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EnrollmentUpdateRequest(
        @NotNull(message = "受講開始日は必須です")
        LocalDate startDate,

        LocalDate endDate,

        @NotBlank(message = "受講状況は必須です")
        String status
) {
}
