package com.student.management.dto.student;

import com.student.management.entity.StudentListItem;

import java.time.LocalDateTime;

public record StudentListItemResponse(
        Long id,
        String name,
        String email,
        String phone,
        String status,
        Long referralSourceId,
        String referralSourceName,
        String courseNames,
        boolean hasUnpaid,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static StudentListItemResponse from(StudentListItem student) {
        return new StudentListItemResponse(
                student.getId(),
                student.getName(),
                student.getEmail(),
                student.getPhone(),
                student.getStatus(),
                student.getReferralSourceId(),
                student.getReferralSourceName(),
                student.getCourseNames(),
                student.isHasUnpaid(),
                student.getCreatedAt(),
                student.getUpdatedAt()
        );
    }
}
