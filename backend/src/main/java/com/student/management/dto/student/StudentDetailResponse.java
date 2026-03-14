package com.student.management.dto.student;

import com.student.management.entity.StudentDetail;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record StudentDetailResponse(
        Long id,
        String name,
        String email,
        String phone,
        String address,
        LocalDate birthdate,
        String gender,
        String status,
        String chatUsername,
        Long referralSourceId,
        String referralSourceName,
        String referralSourceCategory,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<StudentEnrollmentSummaryResponse> enrollments,
        List<StudentPaymentSummaryResponse> payments
) {
    public static StudentDetailResponse from(StudentDetail student,
                                             List<StudentEnrollmentSummaryResponse> enrollments,
                                             List<StudentPaymentSummaryResponse> payments) {
        return new StudentDetailResponse(
                student.getId(),
                student.getName(),
                student.getEmail(),
                student.getPhone(),
                student.getAddress(),
                student.getBirthdate(),
                student.getGender(),
                student.getStatus(),
                student.getChatUsername(),
                student.getReferralSourceId(),
                student.getReferralSourceName(),
                student.getReferralSourceCategory(),
                student.getCreatedAt(),
                student.getUpdatedAt(),
                enrollments,
                payments
        );
    }
}
