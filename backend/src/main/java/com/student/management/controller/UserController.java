package com.student.management.controller;

import com.student.management.dto.user.PasswordResetRequest;
import com.student.management.dto.user.UserCreateRequest;
import com.student.management.dto.user.UserDetailResponse;
import com.student.management.dto.user.UserListItemResponse;
import com.student.management.dto.user.UserUpdateRequest;
import com.student.management.security.CustomUserDetails;
import com.student.management.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserManagementService userManagementService;

    public UserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public ResponseEntity<List<UserListItemResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(userManagementService.getUsers(keyword, role));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDetailResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(userManagementService.getUser(id));
    }

    @PostMapping
    public ResponseEntity<UserDetailResponse> create(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userManagementService.createUser(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDetailResponse> update(@PathVariable Long id,
                                                     @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userManagementService.updateUser(id, request));
    }

    @PostMapping("/{id}/password-reset")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id,
                                              @Valid @RequestBody PasswordResetRequest request) {
        userManagementService.resetPassword(id, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails principal) {
        Long currentUserId = principal != null && principal.getUser() != null
                ? principal.getUser().getId() : null;
        userManagementService.deleteUser(id, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
