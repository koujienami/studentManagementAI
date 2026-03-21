package com.student.management.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 決済の一覧・詳細用（JOIN 結果）
 */
@Data
public class PaymentRow {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long enrollmentId;
    private Long courseId;
    private String courseName;
    private Long courseInstructorId;
    private Integer amount;
    private LocalDate dueDate;
    private LocalDate paidDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
