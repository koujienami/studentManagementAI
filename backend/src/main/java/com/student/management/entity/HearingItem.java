package com.student.management.entity;

import lombok.Data;

@Data
public class HearingItem {
    private Long id;
    private String name;
    private String type;
    private boolean required;
    private int displayOrder;
}
