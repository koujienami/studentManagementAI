package com.student.management.dto.course;

import com.student.management.entity.CourseWithInstructor;

import java.time.LocalDateTime;

public record CourseListItemResponse(
        Long id,
        String name,
        Integer price,
        Long instructorId,
        String instructorName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CourseListItemResponse from(CourseWithInstructor course) {
        return new CourseListItemResponse(
                course.getId(),
                course.getName(),
                course.getPrice(),
                course.getInstructorId(),
                course.getInstructorName(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }
}
