package com.student.management.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotBlank(message = "ユーザー名は必須です")
        @Size(min = 3, max = 50, message = "ユーザー名は3〜50文字で入力してください")
        @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "ユーザー名は半角英数字と . _ - のみ使用できます")
        String username,

        @NotBlank(message = "メールアドレスは必須です")
        @Email(message = "メールアドレスの形式が正しくありません")
        @Size(max = 255, message = "メールアドレスは255文字以内で入力してください")
        String email,

        @NotBlank(message = "氏名は必須です")
        @Size(max = 100, message = "氏名は100文字以内で入力してください")
        String name,

        @NotBlank(message = "ロールは必須です")
        @Pattern(regexp = "^(ADMIN|STAFF|INSTRUCTOR)$", message = "ロールは ADMIN/STAFF/INSTRUCTOR のいずれかです")
        String role,

        @NotBlank(message = "パスワードは必須です")
        @Size(min = 8, max = 128, message = "パスワードは8〜128文字で入力してください")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?`~]+$",
                message = "パスワードは英字と数字を両方含めてください"
        )
        String password
) {
}
