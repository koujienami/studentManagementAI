package com.student.management.service;

import com.student.management.dto.auth.TokenResponse;
import com.student.management.dto.auth.UserResponse;
import com.student.management.entity.User;
import com.student.management.exception.ApiException;
import com.student.management.repository.UserMapper;
import com.student.management.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

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
                .orElseThrow(() -> {
                    log.warn("ログイン失敗（ユーザー不在）: username={}", username);
                    return new ApiException(
                            HttpStatus.UNAUTHORIZED, "ユーザー名またはパスワードが正しくありません");
                });

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            log.warn("ログイン失敗（パスワード不一致）: username={}", username);
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED, "ユーザー名またはパスワードが正しくありません");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        log.info("ログイン成功: userId={}, username={}", user.getId(), user.getUsername());
        return new TokenResponse(accessToken, refreshToken);
    }

    public TokenResponse refresh(String refreshToken) {
        Claims claims = jwtTokenProvider.validateAndGetRefreshClaims(refreshToken)
                .orElseThrow(() -> {
                    log.warn("トークンリフレッシュ失敗（無効なリフレッシュトークン）");
                    return new ApiException(
                            HttpStatus.UNAUTHORIZED, "リフレッシュトークンが無効です");
                });

        String username = claims.getSubject();
        User user = userMapper.findByUsername(username)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED, "ユーザーが見つかりません"));

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), user.getRole());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        log.info("トークンリフレッシュ成功: username={}", username);
        return new TokenResponse(newAccessToken, newRefreshToken);
    }

    public UserResponse getCurrentUser(String username) {
        User user = userMapper.findByUsername(username)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "ユーザーが見つかりません"));
        return UserResponse.from(user);
    }
}
