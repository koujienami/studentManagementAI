package com.student.management.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        String secretKey,
        TokenExpiration accessToken,
        TokenExpiration refreshToken
) {
    public record TokenExpiration(long expiration) {}
}
