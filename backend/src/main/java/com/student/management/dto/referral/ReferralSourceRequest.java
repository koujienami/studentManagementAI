package com.student.management.dto.referral;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ReferralSourceRequest(
        @NotBlank(message = "経路名は必須です")
        @Size(max = 100, message = "経路名は100文字以内で入力してください")
        String name,

        @NotBlank(message = "カテゴリは必須です")
        @Size(max = 50, message = "カテゴリは50文字以内で入力してください")
        @Pattern(
                regexp = "^(WEB|AD|SEARCH|AI|SNS|REFERRAL|OTHER)$",
                message = "カテゴリは WEB/AD/SEARCH/AI/SNS/REFERRAL/OTHER のいずれかです"
        )
        String category,

        @NotNull(message = "表示順は必須です")
        @Min(value = 0, message = "表示順は0以上で入力してください")
        Integer displayOrder
) {
}
