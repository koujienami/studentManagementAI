package com.student.management.entity;

import lombok.Data;

@Data
public class CourseWithInstructor {
    private Long id;
    private String name;
    private String description;
    private Integer price;
    private Long instructorId;
    private String instructorName;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}
