package com.student.management.service;

import com.student.management.dto.PaginatedResponse;
import com.student.management.dto.enrollment.EnrollmentRequest;
import com.student.management.dto.enrollment.EnrollmentResponse;
import com.student.management.dto.enrollment.EnrollmentUpdateRequest;
import com.student.management.entity.Enrollment;
import com.student.management.entity.EnrollmentRow;
import com.student.management.entity.Payment;
import com.student.management.exception.ApiException;
import com.student.management.repository.CourseMapper;
import com.student.management.repository.EnrollmentMapper;
import com.student.management.repository.PaymentMapper;
import com.student.management.repository.StudentMapper;
import com.student.management.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class EnrollmentService {

    private static final String ROLE_INSTRUCTOR = "INSTRUCTOR";
    private static final String PAYMENT_UNPAID = "UNPAID";
    private static final String DEFAULT_ENROLLMENT_STATUS = "ENROLLED";
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> ALLOWED_ENROLLMENT_STATUSES = Set.of(
            "ENROLLED", "COMPLETED", "WITHDRAWN"
    );

    private final EnrollmentMapper enrollmentMapper;
    private final PaymentMapper paymentMapper;
    private final StudentMapper studentMapper;
    private final CourseMapper courseMapper;

    public EnrollmentService(EnrollmentMapper enrollmentMapper,
                             PaymentMapper paymentMapper,
                             StudentMapper studentMapper,
                             CourseMapper courseMapper) {
        this.enrollmentMapper = enrollmentMapper;
        this.paymentMapper = paymentMapper;
        this.studentMapper = studentMapper;
        this.courseMapper = courseMapper;
    }

    public PaginatedResponse<EnrollmentResponse> list(Long studentId,
                                                        Long courseId,
                                                        String status,
                                                        Integer page,
                                                        Integer size) {
        CurrentUser user = getCurrentUser();
        Long instructorId = user.isInstructor() ? user.id() : null;
        int p = normalizePage(page);
        int s = normalizeSize(size);
        int offset = (p - 1) * s;
        long total = enrollmentMapper.countList(studentId, courseId, normalize(status), instructorId);
        List<EnrollmentResponse> content = enrollmentMapper.findList(
                studentId, courseId, normalize(status), instructorId, s, offset
        ).stream().map(EnrollmentResponse::from).toList();
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / s);
        return new PaginatedResponse<>(content, total, totalPages, p, s);
    }

    public EnrollmentResponse get(Long id) {
        CurrentUser user = getCurrentUser();
        EnrollmentRow row = enrollmentMapper.findRowById(id);
        if (row == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "受講履歴が見つかりません");
        }
        assertCanAccessEnrollment(row, user);
        return EnrollmentResponse.from(row);
    }

    @Transactional
    public EnrollmentResponse create(EnrollmentRequest request) {
        if (!studentMapper.existsById(request.studentId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "受講生が見つかりません");
        }
        var course = courseMapper.findById(request.courseId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "コースが見つかりません"));

        long activeCount = enrollmentMapper.countList(request.studentId(), request.courseId(), DEFAULT_ENROLLMENT_STATUS, null);
        if (activeCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "この受講生は既にこのコースを受講中です");
        }

        String enrollmentStatus = resolveEnrollmentStatus(request.status());
        int amount = request.amount() != null ? request.amount() : course.getPrice();
        if (amount < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "金額は0以上で入力してください");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudentId(request.studentId());
        enrollment.setCourseId(request.courseId());
        enrollment.setStartDate(request.startDate());
        enrollment.setEndDate(request.endDate());
        enrollment.setStatus(enrollmentStatus);
        enrollmentMapper.insert(enrollment);

        Payment payment = new Payment();
        payment.setStudentId(request.studentId());
        payment.setEnrollmentId(enrollment.getId());
        payment.setAmount(amount);
        payment.setDueDate(request.dueDate());
        payment.setPaidDate(null);
        payment.setStatus(PAYMENT_UNPAID);
        paymentMapper.insert(payment);

        return get(enrollment.getId());
    }

    @Transactional
    public EnrollmentResponse update(Long id, EnrollmentUpdateRequest request) {
        CurrentUser user = getCurrentUser();
        if (user.isInstructor()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "アクセス権限がありません");
        }

        EnrollmentRow row = enrollmentMapper.findRowById(id);
        if (row == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "受講履歴が見つかりません");
        }

        String nextStatus = request.status() != null ? request.status().trim() : "";
        if (nextStatus.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "受講状況は必須です");
        }
        if (!ALLOWED_ENROLLMENT_STATUSES.contains(nextStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "受講状況の値が不正です");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setId(id);
        enrollment.setStartDate(request.startDate());
        enrollment.setEndDate(request.endDate());
        enrollment.setStatus(nextStatus);
        enrollmentMapper.update(enrollment);

        return get(id);
    }

    private String resolveEnrollmentStatus(String status) {
        String normalized = normalize(status);
        if (normalized == null) {
            return DEFAULT_ENROLLMENT_STATUS;
        }
        if (!ALLOWED_ENROLLMENT_STATUSES.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "受講状況の値が不正です");
        }
        return normalized;
    }

    private void assertCanAccessEnrollment(EnrollmentRow row, CurrentUser user) {
        if (!user.isInstructor()) {
            return;
        }
        if (row.getCourseInstructorId() == null || !row.getCourseInstructorId().equals(user.id())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "受講履歴が見つかりません");
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
