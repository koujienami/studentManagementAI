package com.student.management.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "ユーザー名は必須です")
    private String username;

    @NotBlank(message = "パスワードは必須です")
    private String password;
}
