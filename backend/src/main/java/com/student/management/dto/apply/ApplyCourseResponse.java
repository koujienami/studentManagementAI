package com.student.management.dto.apply;

public record ApplyCourseResponse(
        Long id,
        String name,
        String description,
        Integer price
) {
}
