package com.student.management.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CourseWithInstructor {
    private Long id;
    private String name;
    private String description;
    private Integer price;
    private Long instructorId;
    private String instructorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
