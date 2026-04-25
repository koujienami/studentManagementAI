package com.student.management.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @NotBlank(message = "メールアドレスは必須です")
        @Email(message = "メールアドレスの形式が正しくありません")
        @Size(max = 255, message = "メールアドレスは255文字以内で入力してください")
        String email,

        @NotBlank(message = "氏名は必須です")
        @Size(max = 100, message = "氏名は100文字以内で入力してください")
        String name,

        @NotBlank(message = "ロールは必須です")
        @Pattern(regexp = "^(ADMIN|STAFF|INSTRUCTOR)$", message = "ロールは ADMIN/STAFF/INSTRUCTOR のいずれかです")
        String role
) {
}
