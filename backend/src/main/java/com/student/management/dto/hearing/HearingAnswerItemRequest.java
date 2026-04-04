package com.student.management.dto.hearing;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record HearingAnswerItemRequest(
        @NotNull Long hearingItemId,
        @Size(max = 10_000) String answer
) {
}
