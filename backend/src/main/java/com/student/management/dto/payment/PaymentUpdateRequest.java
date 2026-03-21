package com.student.management.dto.payment;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PaymentUpdateRequest(
        @NotNull(message = "金額は必須です")
        @Min(value = 0, message = "金額は0以上で入力してください")
        Integer amount,

        @NotNull(message = "決済期日は必須です")
        LocalDate dueDate,

        LocalDate paidDate,

        @NotBlank(message = "決済状態は必須です")
        String status
) {
}
