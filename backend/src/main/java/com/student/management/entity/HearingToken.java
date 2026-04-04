package com.student.management.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class HearingToken {
    private Long id;
    private Long studentId;
    private String token;
    private LocalDateTime expiresAt;
    private LocalDateTime usedAt;
    private LocalDateTime createdAt;
}
