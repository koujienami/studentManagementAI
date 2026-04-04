package com.student.management.dto.hearing;

import java.util.List;

public record HearingSessionResponse(
        List<HearingItemResponse> items,
        String displayName,
        boolean canSubmit,
        String message
) {
}
