package com.student.management.service;

import com.student.management.dto.user.PasswordResetRequest;
import com.student.management.dto.user.UserCreateRequest;
import com.student.management.dto.user.UserDetailResponse;
import com.student.management.dto.user.UserListItemResponse;
import com.student.management.dto.user.UserUpdateRequest;
import com.student.management.entity.User;
import com.student.management.exception.ApiException;
import com.student.management.repository.UserMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserManagementService {

    private static final String ROLE_ADMIN = "ADMIN";

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserListItemResponse> getUsers(String keyword, String role) {
        return userMapper.findAll(normalize(keyword), normalize(role)).stream()
                .map(UserListItemResponse::from)
                .toList();
    }

    public UserDetailResponse getUser(Long id) {
        return UserDetailResponse.from(loadUser(id));
    }

    @Transactional
    public UserDetailResponse createUser(UserCreateRequest request) {
        String username = request.username().trim();
        String email = request.email().trim();

        if (userMapper.existsByUsername(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "このユーザー名はすでに使用されています");
        }
        if (userMapper.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "このメールアドレスはすでに使用されています");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setName(request.name().trim());
        user.setRole(request.role());
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        userMapper.insert(user);
        return UserDetailResponse.from(loadUser(user.getId()));
    }

    @Transactional
    public UserDetailResponse updateUser(Long id, UserUpdateRequest request) {
        User user = loadUser(id);

        String email = request.email().trim();
        if (userMapper.existsByEmailExceptId(email, id)) {
            throw new ApiException(HttpStatus.CONFLICT, "このメールアドレスはすでに使用されています");
        }

        boolean roleChangedFromAdmin = ROLE_ADMIN.equals(user.getRole())
                && !ROLE_ADMIN.equals(request.role());
        if (roleChangedFromAdmin && userMapper.countActiveAdmins() <= 1) {
            throw new ApiException(HttpStatus.CONFLICT, "最後の管理者のロールは変更できません");
        }

        user.setEmail(email);
        user.setName(request.name().trim());
        user.setRole(request.role());

        userMapper.update(user);
        return UserDetailResponse.from(loadUser(id));
    }

    @Transactional
    public void resetPassword(Long id, PasswordResetRequest request) {
        loadUser(id);
        userMapper.updatePassword(id, passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public void deleteUser(Long id, Long currentUserId) {
        User user = loadUser(id);

        if (currentUserId != null && currentUserId.equals(id)) {
            throw new ApiException(HttpStatus.CONFLICT, "自分自身は削除できません");
        }

        if (ROLE_ADMIN.equals(user.getRole()) && userMapper.countActiveAdmins() <= 1) {
            throw new ApiException(HttpStatus.CONFLICT, "最後の管理者は削除できません");
        }

        userMapper.softDelete(id);
    }

    private User loadUser(Long id) {
        return userMapper.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません"));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
