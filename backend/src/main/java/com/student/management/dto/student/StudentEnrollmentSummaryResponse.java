package com.student.management.dto.student;

import com.student.management.entity.StudentEnrollmentSummary;

import java.time.LocalDate;

public record StudentEnrollmentSummaryResponse(
        Long id,
        Long courseId,
        String courseName,
        LocalDate startDate,
        LocalDate endDate,
        String status
) {
    public static StudentEnrollmentSummaryResponse from(StudentEnrollmentSummary enrollment) {
        return new StudentEnrollmentSummaryResponse(
                enrollment.getId(),
                enrollment.getCourseId(),
                enrollment.getCourseName(),
                enrollment.getStartDate(),
                enrollment.getEndDate(),
                enrollment.getStatus()
        );
    }
}
