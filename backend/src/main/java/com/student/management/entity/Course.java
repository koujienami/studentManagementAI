package com.student.management.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Course {
    private Long id;
    private String name;
    private String description;
    private Integer price;
    private Long instructorId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
