package com.student.management.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "現在のパスワードは必須です")
    @Size(max = 128, message = "現在のパスワードは128文字以内で入力してください")
    private String currentPassword;

    @NotBlank(message = "新しいパスワードは必須です")
    @Size(min = 8, max = 128, message = "新しいパスワードは8〜128文字で入力してください")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?`~]+$",
            message = "新しいパスワードは英字と数字を両方含めてください"
    )
    private String newPassword;
}
