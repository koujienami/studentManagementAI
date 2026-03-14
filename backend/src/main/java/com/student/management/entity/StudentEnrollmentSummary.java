package com.student.management.entity;

import lombok.Data;

import java.time.LocalDate;

@Data
public class StudentEnrollmentSummary {
    private Long id;
    private Long courseId;
    private String courseName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
}
