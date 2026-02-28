package com.student.management.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshRequest {

    @NotBlank(message = "リフレッシュトークンは必須です")
    private String refreshToken;
}
