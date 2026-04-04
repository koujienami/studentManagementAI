package com.student.management.dto.hearing;

public record HearingItemResponse(
        Long id,
        String name,
        String type,
        boolean required,
        int displayOrder
) {
}
