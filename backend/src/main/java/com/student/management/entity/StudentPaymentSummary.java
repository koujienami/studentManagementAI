package com.student.management.entity;

import lombok.Data;

import java.time.LocalDate;

@Data
public class StudentPaymentSummary {
    private Long id;
    private Long enrollmentId;
    private String courseName;
    private Integer amount;
    private LocalDate dueDate;
    private LocalDate paidDate;
    private String status;
}
