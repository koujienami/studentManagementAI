package com.student.management.dto.student;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record StudentStatusUpdateRequest(
        @NotBlank(message = "状態は必須です")
        @Pattern(
                regexp = "^(PROVISIONAL|PRE_HEARING|POST_HEARING|ENROLLED|COMPLETED|WITHDRAWN)$",
                message = "状態の値が不正です"
        )
        String status
) {
}
