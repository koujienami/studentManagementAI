package com.student.management.dto.referral;

import com.student.management.entity.ReferralSource;

import java.time.LocalDateTime;

public record ReferralSourceAdminResponse(
        Long id,
        String name,
        String category,
        Integer displayOrder,
        boolean deleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ReferralSourceAdminResponse from(ReferralSource source) {
        return new ReferralSourceAdminResponse(
                source.getId(),
                source.getName(),
                source.getCategory(),
                source.getDisplayOrder(),
                source.getDeletedAt() != null,
                source.getCreatedAt(),
                source.getUpdatedAt()
        );
    }
}
