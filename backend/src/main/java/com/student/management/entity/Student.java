package com.student.management.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class Student {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private LocalDate birthdate;
    private String gender;
    private String status;
    private String chatUsername;
    private Long referralSourceId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
