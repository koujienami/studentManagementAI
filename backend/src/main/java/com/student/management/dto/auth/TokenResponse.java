package com.student.management.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.ToString;

@Data
@AllArgsConstructor
public class TokenResponse {
    @ToString.Exclude
    private String accessToken;
    @ToString.Exclude
    private String refreshToken;
}
