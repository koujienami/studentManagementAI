package com.student.management.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReferralSource {
    private Long id;
    private String name;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
