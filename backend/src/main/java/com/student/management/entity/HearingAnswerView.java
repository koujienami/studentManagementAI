package com.student.management.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class HearingAnswerView {
    private Long hearingItemId;
    private String itemName;
    private String answer;
    private LocalDateTime answeredAt;
}
