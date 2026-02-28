package com.student.management.service;

import com.student.management.dto.auth.TokenResponse;
import com.student.management.dto.auth.UserResponse;
import com.student.management.entity.User;
import com.student.management.exception.ApiException;
import com.student.management.repository.UserMapper;
import com.student.management.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserMapper userMapper,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public TokenResponse login(String username, String password) {
        User user = userMapper.findByUsername(username)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED, "ユーザー名またはパスワードが正しくありません"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED, "ユーザー名またはパスワードが正しくありません");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        return new TokenResponse(accessToken, refreshToken);
    }

    public TokenResponse refresh(String refreshToken) {
        if (!jwtTokenProvider.validateRefreshToken(refreshToken)) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED, "リフレッシュトークンが無効です");
        }

        String username = jwtTokenProvider.getUsername(refreshToken);
        User user = userMapper.findByUsername(username)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED, "ユーザーが見つかりません"));

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), user.getRole());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        return new TokenResponse(newAccessToken, newRefreshToken);
    }

    public UserResponse getCurrentUser(String username) {
        User user = userMapper.findByUsername(username)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "ユーザーが見つかりません"));
        return UserResponse.from(user);
    }
}
