package com.student.management.dto.hearing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record HearingAnswerSubmitRequest(
        @NotEmpty @Valid List<HearingAnswerItemRequest> answers
) {
}
