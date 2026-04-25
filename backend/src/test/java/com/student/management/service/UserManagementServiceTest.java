package com.student.management.service;

import com.student.management.dto.user.PasswordResetRequest;
import com.student.management.dto.user.UserCreateRequest;
import com.student.management.dto.user.UserUpdateRequest;
import com.student.management.entity.User;
import com.student.management.exception.ApiException;
import com.student.management.repository.UserMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserManagementService userManagementService;

    @Test
    void createUser_hashesPasswordAndInserts() {
        when(userMapper.existsByUsername("alice")).thenReturn(false);
        when(userMapper.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Pass1234")).thenReturn("HASHED");
        doAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(10L);
            return null;
        }).when(userMapper).insert(any(User.class));
        User stored = new User();
        stored.setId(10L);
        stored.setUsername("alice");
        stored.setEmail("alice@example.com");
        stored.setName("Alice");
        stored.setRole("STAFF");
        when(userMapper.findById(10L)).thenReturn(Optional.of(stored));

        var response = userManagementService.createUser(new UserCreateRequest(
                "alice", "alice@example.com", "Alice", "STAFF", "Pass1234"));

        assertThat(response.id()).isEqualTo(10L);
        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userMapper).insert(cap.capture());
        assertThat(cap.getValue().getPasswordHash()).isEqualTo("HASHED");
    }

    @Test
    void createUser_whenUsernameExists_throwsConflict() {
        when(userMapper.existsByUsername("alice")).thenReturn(true);

        assertThatThrownBy(() -> userManagementService.createUser(new UserCreateRequest(
                "alice", "a@example.com", "A", "STAFF", "Pass1234")))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(userMapper, never()).insert(any());
    }

    @Test
    void createUser_whenEmailExists_throwsConflict() {
        when(userMapper.existsByUsername("alice")).thenReturn(false);
        when(userMapper.existsByEmail("a@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userManagementService.createUser(new UserCreateRequest(
                "alice", "a@example.com", "A", "STAFF", "Pass1234")))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void deleteUser_self_throwsConflict() {
        User self = adminUser(5L);
        when(userMapper.findById(5L)).thenReturn(Optional.of(self));

        assertThatThrownBy(() -> userManagementService.deleteUser(5L, 5L))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(userMapper, never()).softDelete(anyLong());
    }

    @Test
    void deleteUser_lastAdmin_throwsConflict() {
        User admin = adminUser(7L);
        when(userMapper.findById(7L)).thenReturn(Optional.of(admin));
        when(userMapper.countActiveAdmins()).thenReturn(1L);

        assertThatThrownBy(() -> userManagementService.deleteUser(7L, 8L))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(userMapper, never()).softDelete(anyLong());
    }

    @Test
    void deleteUser_whenAdminWithSiblings_softDeletes() {
        User admin = adminUser(7L);
        when(userMapper.findById(7L)).thenReturn(Optional.of(admin));
        when(userMapper.countActiveAdmins()).thenReturn(2L);

        userManagementService.deleteUser(7L, 8L);

        verify(userMapper).softDelete(7L);
    }

    @Test
    void deleteUser_whenStaff_softDeletesWithoutAdminCount() {
        User staff = new User();
        staff.setId(9L);
        staff.setRole("STAFF");
        when(userMapper.findById(9L)).thenReturn(Optional.of(staff));

        userManagementService.deleteUser(9L, 8L);

        verify(userMapper).softDelete(9L);
        verify(userMapper, never()).countActiveAdmins();
    }

    @Test
    void updateUser_whenChangingLastAdminRole_throwsConflict() {
        User admin = adminUser(7L);
        when(userMapper.findById(7L)).thenReturn(Optional.of(admin));
        when(userMapper.existsByEmailExceptId("admin@example.com", 7L)).thenReturn(false);
        when(userMapper.countActiveAdmins()).thenReturn(1L);

        assertThatThrownBy(() -> userManagementService.updateUser(7L,
                new UserUpdateRequest("admin@example.com", "Admin", "STAFF")))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(userMapper, never()).update(any());
    }

    @Test
    void resetPassword_hashesAndUpdates() {
        when(userMapper.findById(3L)).thenReturn(Optional.of(adminUser(3L)));
        when(passwordEncoder.encode("NewPass99")).thenReturn("NEW_HASH");

        userManagementService.resetPassword(3L, new PasswordResetRequest("NewPass99"));

        verify(userMapper).updatePassword(eq(3L), anyString());
        verify(userMapper).updatePassword(3L, "NEW_HASH");
    }

    private User adminUser(Long id) {
        User u = new User();
        u.setId(id);
        u.setUsername("admin" + id);
        u.setEmail("admin@example.com");
        u.setName("Admin");
        u.setRole("ADMIN");
        return u;
    }
}
