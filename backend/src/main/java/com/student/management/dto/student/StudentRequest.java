package com.student.management.dto.student;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record StudentRequest(
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

        @Size(max = 500, message = "住所は500文字以内で入力してください")
        String address,

        @PastOrPresent(message = "生年月日は今日以前の日付を指定してください")
        LocalDate birthdate,

        @Pattern(
                regexp = "^$|^(MALE|FEMALE|OTHER)$",
                message = "性別の値が不正です"
        )
        String gender,

        @Size(max = 100, message = "チャットユーザー名は100文字以内で入力してください")
        String chatUsername,

        @NotNull(message = "申込経路は必須です")
        Long referralSourceId,

        @Pattern(
                regexp = "^$|^(PROVISIONAL|PRE_HEARING|POST_HEARING|ENROLLED|COMPLETED|WITHDRAWN)$",
                message = "状態の値が不正です"
        )
        String status
) {
}
