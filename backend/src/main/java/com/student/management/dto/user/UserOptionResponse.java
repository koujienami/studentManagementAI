package com.student.management.dto.user;

import com.student.management.entity.User;

public record UserOptionResponse(
        Long id,
        String name,
        String username
) {
    public static UserOptionResponse from(User user) {
        return new UserOptionResponse(user.getId(), user.getName(), user.getUsername());
    }
}
