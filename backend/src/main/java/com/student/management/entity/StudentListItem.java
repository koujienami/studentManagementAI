package com.student.management.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StudentListItem {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String status;
    private Long referralSourceId;
    private String referralSourceName;
    private String courseNames;
    private boolean hasUnpaid;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
