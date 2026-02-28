package com.student.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

@Data
@AllArgsConstructor
public class ErrorResponse {
    private int status;
    private String message;
    private Map<String, String> details;

    public ErrorResponse(int status, String message) {
        this(status, message, null);
    }
}
