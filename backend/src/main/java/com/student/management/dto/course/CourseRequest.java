package com.student.management.dto.course;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CourseRequest(
        @NotBlank(message = "コース名は必須です")
        @Size(max = 200, message = "コース名は200文字以内で入力してください")
        String name,

        @Size(max = 5000, message = "コース説明は5000文字以内で入力してください")
        String description,

        @NotNull(message = "料金は必須です")
        @Min(value = 0, message = "料金は0以上で入力してください")
        Integer price,

        Long instructorId
) {
}
