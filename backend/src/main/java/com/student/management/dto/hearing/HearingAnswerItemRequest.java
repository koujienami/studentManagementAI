package com.student.management.dto.hearing;

import jakarta.validation.constraints.NotNull;

public record HearingAnswerItemRequest(
        @NotNull Long hearingItemId,
        String answer
) {
}
