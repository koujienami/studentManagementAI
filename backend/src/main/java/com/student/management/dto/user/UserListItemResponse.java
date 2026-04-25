package com.student.management.dto.user;

import com.student.management.entity.User;

import java.time.LocalDateTime;

public record UserListItemResponse(
        Long id,
        String username,
        String email,
        String name,
        String role,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserListItemResponse from(User user) {
        return new UserListItemResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
