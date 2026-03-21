package com.student.management.dto.enrollment;

import com.student.management.entity.EnrollmentRow;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record EnrollmentResponse(
        Long id,
        Long studentId,
        String studentName,
        Long courseId,
        String courseName,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static EnrollmentResponse from(EnrollmentRow row) {
        return new EnrollmentResponse(
                row.getId(),
                row.getStudentId(),
                row.getStudentName(),
                row.getCourseId(),
                row.getCourseName(),
                row.getStartDate(),
                row.getEndDate(),
                row.getStatus(),
                row.getCreatedAt(),
                row.getUpdatedAt()
        );
    }
}
