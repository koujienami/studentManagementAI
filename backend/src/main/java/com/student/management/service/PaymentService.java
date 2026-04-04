package com.student.management.service;

import com.student.management.dto.PaginatedResponse;
import com.student.management.dto.payment.PaymentResponse;
import com.student.management.dto.payment.PaymentUpdateRequest;
import com.student.management.entity.Payment;
import com.student.management.entity.PaymentRow;
import com.student.management.exception.ApiException;
import com.student.management.repository.PaymentMapper;
import com.student.management.repository.StudentMapper;
import com.student.management.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class PaymentService {

    private static final String ROLE_INSTRUCTOR = "INSTRUCTOR";
    private static final String PAYMENT_UNPAID = "UNPAID";
    private static final String PAYMENT_PAID = "PAID";
    private static final String STATUS_PROVISIONAL = "PROVISIONAL";
    private static final String STATUS_PRE_HEARING = "PRE_HEARING";
    private static final ZoneId ZONE_TOKYO = ZoneId.of("Asia/Tokyo");
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> ALLOWED_PAYMENT_STATUSES = Set.of(PAYMENT_UNPAID, PAYMENT_PAID);

    private final PaymentMapper paymentMapper;
    private final StudentMapper studentMapper;
    private final HearingService hearingService;

    public PaymentService(PaymentMapper paymentMapper,
                          StudentMapper studentMapper,
                          HearingService hearingService) {
        this.paymentMapper = paymentMapper;
        this.studentMapper = studentMapper;
        this.hearingService = hearingService;
    }

    public PaginatedResponse<PaymentResponse> list(Long studentId,
                                                     Long courseId,
                                                     String status,
                                                     Integer page,
                                                     Integer size) {
        CurrentUser user = getCurrentUser();
        Long instructorId = user.isInstructor() ? user.id() : null;
        int p = normalizePage(page);
        int s = normalizeSize(size);
        int offset = (p - 1) * s;
        long total = paymentMapper.countList(studentId, courseId, normalize(status), instructorId);
        List<PaymentResponse> content = paymentMapper.findList(
                studentId, courseId, normalize(status), instructorId, s, offset
        ).stream().map(PaymentResponse::from).toList();
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / s);
        return new PaginatedResponse<>(content, total, totalPages, p, s);
    }

    public PaymentResponse get(Long id) {
        CurrentUser user = getCurrentUser();
        PaymentRow row = paymentMapper.findRowById(id);
        if (row == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "決済が見つかりません");
        }
        assertCanAccessPayment(row, user);
        return PaymentResponse.from(row);
    }

    /**
     * 入金確認（UNPAID→PAID）時、受講生が PROVISIONAL なら PRE_HEARING へ更新する（設計ドキュメント準拠）。
     */
    @Transactional
    public PaymentResponse update(Long id, PaymentUpdateRequest request) {
        CurrentUser user = getCurrentUser();
        if (user.isInstructor()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "アクセス権限がありません");
        }

        PaymentRow row = paymentMapper.findRowById(id);
        if (row == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "決済が見つかりません");
        }

        String nextStatus = request.status() != null ? request.status().trim() : "";
        if (nextStatus.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "決済状態は必須です");
        }
        if (!ALLOWED_PAYMENT_STATUSES.contains(nextStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "決済状態の値が不正です");
        }

        if (PAYMENT_PAID.equals(row.getStatus()) && PAYMENT_UNPAID.equals(nextStatus)) {
            throw new ApiException(HttpStatus.CONFLICT, "入金済みの決済を未払いに戻せません");
        }

        boolean becamePaid = PAYMENT_UNPAID.equals(row.getStatus()) && PAYMENT_PAID.equals(nextStatus);

        LocalDate paidDate = request.paidDate();
        if (PAYMENT_PAID.equals(nextStatus)) {
            if (paidDate == null) {
                paidDate = LocalDate.now(ZONE_TOKYO);
            }
        } else {
            paidDate = null;
        }

        Payment payment = new Payment();
        payment.setId(id);
        payment.setAmount(request.amount());
        payment.setDueDate(request.dueDate());
        payment.setPaidDate(paidDate);
        payment.setStatus(nextStatus);
        paymentMapper.update(payment);

        if (becamePaid) {
            maybeAdvanceStudentAfterPayment(row.getStudentId());
        }

        return get(id);
    }

    private void maybeAdvanceStudentAfterPayment(Long studentId) {
        String st = studentMapper.findStatusById(studentId);
        if (STATUS_PROVISIONAL.equals(st)) {
            studentMapper.updateStatus(studentId, STATUS_PRE_HEARING);
            hearingService.issueTokenIfAbsent(studentId);
        }
    }

    private void assertCanAccessPayment(PaymentRow row, CurrentUser user) {
        if (!user.isInstructor()) {
            return;
        }
        if (row.getCourseInstructorId() == null || !row.getCourseInstructorId().equals(user.id())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "決済が見つかりません");
        }
    }

    private CurrentUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "認証情報を取得できません");
        }
        return new CurrentUser(userDetails.getUser().getId(), userDetails.getUser().getRole());
    }

    private int normalizePage(Integer page) {
        if (page == null || page < 1) {
            return DEFAULT_PAGE;
        }
        return page;
    }

    private int normalizeSize(Integer size) {
        if (size == null || size < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record CurrentUser(Long id, String role) {
        private boolean isInstructor() {
            return ROLE_INSTRUCTOR.equals(role);
        }
    }
}
