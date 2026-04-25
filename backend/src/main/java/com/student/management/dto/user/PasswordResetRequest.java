package com.student.management.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(
        @NotBlank(message = "新しいパスワードは必須です")
        @Size(min = 8, max = 128, message = "パスワードは8〜128文字で入力してください")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?`~]+$",
                message = "パスワードは英字と数字を両方含めてください"
        )
        String newPassword
) {
}
