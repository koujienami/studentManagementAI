package com.student.management.dto.course;

import com.student.management.entity.CourseWithInstructor;

import java.time.LocalDateTime;

public record CourseResponse(
        Long id,
        String name,
        String description,
        Integer price,
        Long instructorId,
        String instructorName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CourseResponse from(CourseWithInstructor course) {
        return new CourseResponse(
                course.getId(),
                course.getName(),
                course.getDescription(),
                course.getPrice(),
                course.getInstructorId(),
                course.getInstructorName(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }
}
