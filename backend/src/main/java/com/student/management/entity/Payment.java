package com.student.management.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class Payment {
    private Long id;
    private Long studentId;
    private Long enrollmentId;
    private Integer amount;
    private LocalDate dueDate;
    private LocalDate paidDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
