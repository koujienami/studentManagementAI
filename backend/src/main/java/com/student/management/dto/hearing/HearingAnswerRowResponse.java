package com.student.management.dto.hearing;

import java.time.LocalDateTime;

public record HearingAnswerRowResponse(
        Long hearingItemId,
        String itemName,
        String answer,
        LocalDateTime answeredAt
) {
}
