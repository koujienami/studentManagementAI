package com.student.management.dto.apply;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ApplyRequest(
        @NotBlank(message = "氏名は必須です")
        @Size(max = 100, message = "氏名は100文字以内で入力してください")
        String name,

        @NotBlank(message = "メールアドレスは必須です")
        @Email(message = "メールアドレスの形式が不正です")
        @Size(max = 255, message = "メールアドレスは255文字以内で入力してください")
        String email,

        @Size(max = 20, message = "電話番号は20文字以内で入力してください")
        @Pattern(
                regexp = "^$|^[0-9+()\\-\\s]{8,20}$",
                message = "電話番号の形式が不正です"
        )
        String phone,

        @NotNull(message = "コースは必須です")
        Long courseId,

        @NotNull(message = "申込経路は必須です")
        Long referralSourceId
) {
}
