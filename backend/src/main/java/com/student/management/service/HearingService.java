package com.student.management.service;

import com.student.management.dto.hearing.HearingAnswerItemRequest;
import com.student.management.dto.hearing.HearingAnswerRowResponse;
import com.student.management.dto.hearing.HearingAnswerSubmitRequest;
import com.student.management.dto.hearing.HearingItemResponse;
import com.student.management.dto.hearing.HearingSessionResponse;
import com.student.management.dto.hearing.HearingTokenIssuedResponse;
import com.student.management.entity.HearingItem;
import com.student.management.entity.HearingToken;
import com.student.management.entity.HearingAnswerView;
import com.student.management.entity.StudentDetail;
import com.student.management.exception.ApiException;
import com.student.management.domain.StudentStatusCodes;
import com.student.management.repository.HearingAnswerMapper;
import com.student.management.repository.HearingItemMapper;
import com.student.management.repository.HearingTokenMapper;
import com.student.management.repository.StudentMapper;
import com.student.management.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class HearingService {

    /** ヒアリング URL トークンの有効期限（発行からの時間） */
    private static final int HEARING_TOKEN_TTL_HOURS = 72;
    private static final ZoneId ZONE_TOKYO = ZoneId.of("Asia/Tokyo");

    private final StudentMapper studentMapper;
    private final HearingTokenMapper hearingTokenMapper;
    private final HearingItemMapper hearingItemMapper;
    private final HearingAnswerMapper hearingAnswerMapper;

    private final SecureRandom secureRandom = new SecureRandom();

    public HearingService(StudentMapper studentMapper,
                          HearingTokenMapper hearingTokenMapper,
                          HearingItemMapper hearingItemMapper,
                          HearingAnswerMapper hearingAnswerMapper) {
        this.studentMapper = studentMapper;
        this.hearingTokenMapper = hearingTokenMapper;
        this.hearingItemMapper = hearingItemMapper;
        this.hearingAnswerMapper = hearingAnswerMapper;
    }

    /**
     * 入金確認で仮登録→ヒアリング前になった直後など、未使用トークンが無ければ発行する。
     */
    @Transactional
    public void issueTokenIfAbsent(Long studentId) {
        String st = studentMapper.findStatusById(studentId);
        if (st == null || !StudentStatusCodes.PRE_HEARING.equals(st)) {
            return;
        }
        if (hearingTokenMapper.findActiveUnusedByStudentId(studentId).isPresent()) {
            return;
        }
        insertNewToken(studentId);
    }

    /**
     * 有効な未使用トークンがあれば返す（管理画面でのURL表示用）。
     */
    public Optional<HearingTokenIssuedResponse> findActiveToken(Long studentId) {
        if (!studentMapper.existsById(studentId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "受講生が見つかりません");
        }
        return hearingTokenMapper.findActiveUnusedByStudentId(studentId)
                .map(t -> new HearingTokenIssuedResponse(t.getToken()));
    }

    /**
     * 管理画面からの再発行。既存の未使用トークンは使用済みにし、新規トークンを返す。
     */
    @Transactional
    public HearingTokenIssuedResponse rotateToken(Long studentId) {
        String st = studentMapper.findStatusById(studentId);
        if (st == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "受講生が見つかりません");
        }
        if (!StudentStatusCodes.PRE_HEARING.equals(st)) {
            throw new ApiException(HttpStatus.CONFLICT, "ヒアリング前の受講生のみトークンを発行できます");
        }
        hearingTokenMapper.markAllUnusedUsedForStudent(studentId, LocalDateTime.now(ZONE_TOKYO));
        HearingToken row = insertNewToken(studentId);
        return new HearingTokenIssuedResponse(row.getToken());
    }

    public HearingSessionResponse getSession(String tokenValue) {
        HearingToken token = hearingTokenMapper.findByToken(tokenValue)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "無効なURLです"));

        // 早期リターン（UX）。同時リクエスト時の最終判定は submitAnswers 側の markUsedIfUnused に委ねる。
        if (token.getUsedAt() != null) {
            throw new ApiException(HttpStatus.GONE, "このURLはすでに使用済みです");
        }
        LocalDateTime now = LocalDateTime.now(ZONE_TOKYO);
        if (token.getExpiresAt() != null && token.getExpiresAt().isBefore(now)) {
            throw new ApiException(HttpStatus.GONE, "このURLの有効期限が切れています");
        }

        StudentDetail student = studentMapper.findDetailById(token.getStudentId(), null)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "受講生が見つかりません"));

        List<HearingItemResponse> items = hearingItemMapper.findAllOrdered().stream()
                .map(this::toItemResponse)
                .toList();

        String displayName = maskDisplayName(student.getName());
        String status = student.getStatus();
        boolean canSubmit = StudentStatusCodes.PRE_HEARING.equals(status);
        String message = "";
        if (!canSubmit) {
            message = switch (status) {
                case StudentStatusCodes.ENROLLED, StudentStatusCodes.POST_HEARING, StudentStatusCodes.COMPLETED ->
                        "すでにヒアリングを完了しているか、受講が開始されています。";
                case StudentStatusCodes.PROVISIONAL -> "入金確認前のため、ヒアリングに回答できません。";
                case StudentStatusCodes.WITHDRAWN -> "退会済みのため、ヒアリングに回答できません。";
                default -> "現在の状態ではヒアリングに回答できません。";
            };
        }

        return new HearingSessionResponse(items, displayName, canSubmit, message);
    }

    @Transactional
    public void submitAnswers(String tokenValue, HearingAnswerSubmitRequest request) {
        HearingToken token = hearingTokenMapper.findByToken(tokenValue)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "無効なURLです"));

        // 早期リターン（UX）。同時送信の排他は直後の markUsedIfUnused が担う。
        if (token.getUsedAt() != null) {
            throw new ApiException(HttpStatus.GONE, "このURLはすでに使用済みです");
        }
        LocalDateTime now = LocalDateTime.now(ZONE_TOKYO);
        if (token.getExpiresAt() != null && token.getExpiresAt().isBefore(now)) {
            throw new ApiException(HttpStatus.GONE, "このURLの有効期限が切れています");
        }

        Long studentId = token.getStudentId();
        String status = studentMapper.findStatusById(studentId);
        if (!StudentStatusCodes.PRE_HEARING.equals(status)) {
            throw new ApiException(HttpStatus.CONFLICT, "ヒアリングに回答できる状態ではありません");
        }

        List<HearingItem> masterItems = hearingItemMapper.findAllOrdered();
        Map<Long, HearingItem> itemById = masterItems.stream()
                .collect(Collectors.toMap(HearingItem::getId, i -> i));

        Map<Long, String> answerByItem = new HashMap<>();
        for (HearingAnswerItemRequest a : request.answers()) {
            if (!itemById.containsKey(a.hearingItemId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "存在しないヒアリング項目が含まれています");
            }
            String text = a.answer() == null ? "" : a.answer().trim();
            answerByItem.put(a.hearingItemId(), text);
        }

        for (HearingItem item : masterItems) {
            if (!item.isRequired()) {
                continue;
            }
            String text = answerByItem.get(item.getId());
            if (text == null || text.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "必須のヒアリング項目に回答してください");
            }
        }

        int claimed = hearingTokenMapper.markUsedIfUnused(token.getId(), now);
        if (claimed == 0) {
            throw new ApiException(HttpStatus.GONE, "このURLはすでに使用済みです");
        }

        for (HearingItem item : masterItems) {
            String text = answerByItem.getOrDefault(item.getId(), "");
            hearingAnswerMapper.upsert(studentId, item.getId(), text, now);
        }

        studentMapper.updateStatus(studentId, StudentStatusCodes.ENROLLED);
    }

    public List<HearingAnswerRowResponse> listAnswersForStudent(Long studentId) {
        Long instructorId = resolveInstructorIdForAccess();
        studentMapper.findDetailById(studentId, instructorId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "受講生が見つかりません"));

        return hearingAnswerMapper.findByStudentId(studentId).stream()
                .map(this::toRowResponse)
                .toList();
    }

    private HearingToken insertNewToken(Long studentId) {
        HearingToken row = new HearingToken();
        row.setStudentId(studentId);
        row.setToken(generateToken());
        row.setExpiresAt(LocalDateTime.now(ZONE_TOKYO).plusHours(HEARING_TOKEN_TTL_HOURS));
        row.setUsedAt(null);
        hearingTokenMapper.insert(row);
        return row;
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private HearingItemResponse toItemResponse(HearingItem item) {
        return new HearingItemResponse(
                item.getId(),
                item.getName(),
                item.getType(),
                item.isRequired(),
                item.getDisplayOrder()
        );
    }

    private HearingAnswerRowResponse toRowResponse(HearingAnswerView v) {
        return new HearingAnswerRowResponse(
                v.getHearingItemId(),
                v.getItemName(),
                v.getAnswer(),
                v.getAnsweredAt()
        );
    }

    private static String maskDisplayName(String name) {
        if (name == null || name.isBlank()) {
            return "お客様";
        }
        String t = name.trim();
        if (t.length() <= 1) {
            return t + "様";
        }
        return t.charAt(0) + "＊＊様";
    }

    private Long resolveInstructorIdForAccess() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "認証情報を取得できません");
        }
        String role = userDetails.getUser().getRole();
        if ("INSTRUCTOR".equals(role)) {
            return userDetails.getUser().getId();
        }
        return null;
    }

}
