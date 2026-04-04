package com.student.management.service;

import com.student.management.dto.PaginatedResponse;
import com.student.management.dto.student.StudentDetailResponse;
import com.student.management.dto.student.StudentEnrollmentSummaryResponse;
import com.student.management.dto.student.StudentListItemResponse;
import com.student.management.dto.student.StudentPaymentSummaryResponse;
import com.student.management.dto.student.StudentRequest;
import com.student.management.dto.student.StudentStatusUpdateRequest;
import com.student.management.entity.Student;
import com.student.management.entity.StudentDetail;
import com.student.management.entity.StudentListItem;
import com.student.management.exception.ApiException;
import com.student.management.domain.StudentStatusCodes;
import com.student.management.repository.ReferralSourceMapper;
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
public class StudentService {

    private static final String ROLE_INSTRUCTOR = "INSTRUCTOR";
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> ALLOWED_INITIAL_STATUSES = Set.of(
            StudentStatusCodes.PROVISIONAL,
            StudentStatusCodes.PRE_HEARING,
            StudentStatusCodes.POST_HEARING,
            StudentStatusCodes.ENROLLED,
            StudentStatusCodes.COMPLETED,
            StudentStatusCodes.WITHDRAWN
    );

    private final StudentMapper studentMapper;
    private final ReferralSourceMapper referralSourceMapper;

    public StudentService(StudentMapper studentMapper, ReferralSourceMapper referralSourceMapper) {
        this.studentMapper = studentMapper;
        this.referralSourceMapper = referralSourceMapper;
    }

    public PaginatedResponse<StudentListItemResponse> getStudents(String keyword,
                                                                  String status,
                                                                  Long referralSourceId,
                                                                  Boolean hasUnpaid,
                                                                  Long courseId,
                                                                  Integer page,
                                                                  Integer size) {
        CurrentUser currentUser = getCurrentUser();
        Long instructorId = currentUser.isInstructor() ? currentUser.id() : null;
        int normalizedPage = normalizePage(page);
        int normalizedSize = normalizeSize(size);
        int offset = (normalizedPage - 1) * normalizedSize;
        long totalElements = studentMapper.countAll(
                normalize(keyword),
                normalize(status),
                referralSourceId,
                hasUnpaid,
                courseId,
                instructorId
        );

        List<StudentListItemResponse> content = studentMapper.findAll(
                normalize(keyword),
                normalize(status),
                referralSourceId,
                hasUnpaid,
                courseId,
                instructorId,
                normalizedSize,
                offset
        ).stream()
                .map(student -> toListItemResponse(student, currentUser.isInstructor()))
                .toList();

        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / normalizedSize);
        return new PaginatedResponse<>(content, totalElements, totalPages, normalizedPage, normalizedSize);
    }

    public StudentDetailResponse getStudent(Long id) {
        CurrentUser currentUser = getCurrentUser();
        Long instructorId = currentUser.isInstructor() ? currentUser.id() : null;

        StudentDetail student = studentMapper.findDetailById(id, instructorId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "受講生が見つかりません"));

        List<StudentEnrollmentSummaryResponse> enrollments = studentMapper.findEnrollmentSummaries(id).stream()
                .map(StudentEnrollmentSummaryResponse::from)
                .toList();

        List<StudentPaymentSummaryResponse> payments = currentUser.isInstructor()
                ? List.of()
                : studentMapper.findPaymentSummaries(id).stream()
                .map(StudentPaymentSummaryResponse::from)
                .toList();

        return toDetailResponse(student, enrollments, payments, currentUser.isInstructor());
    }

    @Transactional
    public StudentDetailResponse createStudent(StudentRequest request) {
        validateStudentRequest(request, null);

        Student student = toEntity(request);
        student.setStatus(resolveInitialStatus(request.status()));
        studentMapper.insert(student);

        return getStudent(student.getId());
    }

    @Transactional
    public StudentDetailResponse updateStudent(Long id, StudentRequest request) {
        ensureStudentExists(id);
        validateStudentRequest(request, id);

        Student student = toEntity(request);
        student.setId(id);
        studentMapper.update(student);

        return getStudent(id);
    }

    @Transactional
    public StudentDetailResponse updateStatus(Long id, StudentStatusUpdateRequest request) {
        StudentDetail currentStudent = studentMapper.findDetailById(id, null)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "受講生が見つかりません"));

        String nextStatus = request.status().trim();
        if (!isTransitionAllowed(currentStudent.getStatus(), nextStatus)) {
            throw new ApiException(HttpStatus.CONFLICT, "指定された状態へは遷移できません");
        }

        studentMapper.updateStatus(id, nextStatus);
        return getStudent(id);
    }

    @Transactional
    public void deleteStudent(Long id) {
        ensureStudentExists(id);

        if (studentMapper.hasRelatedRecords(id)) {
            throw new ApiException(HttpStatus.CONFLICT, "関連データが存在する受講生は削除できません。退会状態へ変更してください");
        }

        studentMapper.deleteById(id);
    }

    private void ensureStudentExists(Long id) {
        if (!studentMapper.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "受講生が見つかりません");
        }
    }

    private void validateStudentRequest(StudentRequest request, Long studentId) {
        String normalizedEmail = normalize(request.email());
        if (normalizedEmail == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "メールアドレスは必須です");
        }

        boolean emailExists = studentId == null
                ? studentMapper.existsByEmail(normalizedEmail)
                : studentMapper.existsByEmailExcludingId(normalizedEmail, studentId);
        if (emailExists) {
            throw new ApiException(HttpStatus.CONFLICT, "同じメールアドレスの受講生が既に存在します");
        }

        if (!referralSourceMapper.existsById(request.referralSourceId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "申込経路が存在しません");
        }
    }

    private Student toEntity(StudentRequest request) {
        Student student = new Student();
        student.setName(request.name().trim());
        student.setEmail(normalize(request.email()));
        student.setPhone(normalize(request.phone()));
        student.setAddress(normalize(request.address()));
        student.setBirthdate(request.birthdate());
        student.setGender(normalize(request.gender()));
        student.setChatUsername(normalize(request.chatUsername()));
        student.setReferralSourceId(request.referralSourceId());
        return student;
    }

    private String resolveInitialStatus(String status) {
        String normalizedStatus = normalize(status);
        if (normalizedStatus == null) {
            return StudentStatusCodes.PROVISIONAL;
        }

        if (!ALLOWED_INITIAL_STATUSES.contains(normalizedStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "状態の値が不正です");
        }

        return normalizedStatus;
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

    private boolean isTransitionAllowed(String currentStatus, String nextStatus) {
        if (currentStatus.equals(nextStatus)) {
            return true;
        }

        return switch (currentStatus) {
            case StudentStatusCodes.PROVISIONAL ->
                    StudentStatusCodes.PRE_HEARING.equals(nextStatus) || StudentStatusCodes.WITHDRAWN.equals(nextStatus);
            case StudentStatusCodes.PRE_HEARING ->
                    StudentStatusCodes.POST_HEARING.equals(nextStatus)
                            || StudentStatusCodes.ENROLLED.equals(nextStatus)
                            || StudentStatusCodes.WITHDRAWN.equals(nextStatus);
            case StudentStatusCodes.POST_HEARING ->
                    StudentStatusCodes.ENROLLED.equals(nextStatus) || StudentStatusCodes.WITHDRAWN.equals(nextStatus);
            case StudentStatusCodes.ENROLLED ->
                    StudentStatusCodes.COMPLETED.equals(nextStatus) || StudentStatusCodes.WITHDRAWN.equals(nextStatus);
            default -> false;
        };
    }

    private StudentListItemResponse toListItemResponse(StudentListItem student, boolean instructorView) {
        if (!instructorView) {
            return StudentListItemResponse.from(student);
        }

        return new StudentListItemResponse(
                student.getId(),
                student.getName(),
                "非公開",
                null,
                student.getStatus(),
                student.getReferralSourceId(),
                student.getReferralSourceName(),
                student.getCourseNames(),
                student.isHasUnpaid(),
                student.getCreatedAt(),
                student.getUpdatedAt()
        );
    }

    private StudentDetailResponse toDetailResponse(StudentDetail student,
                                                   List<StudentEnrollmentSummaryResponse> enrollments,
                                                   List<StudentPaymentSummaryResponse> payments,
                                                   boolean instructorView) {
        if (!instructorView) {
            return StudentDetailResponse.from(student, enrollments, payments);
        }

        return new StudentDetailResponse(
                student.getId(),
                student.getName(),
                "非公開",
                null,
                null,
                null,
                student.getGender(),
                student.getStatus(),
                student.getChatUsername(),
                student.getReferralSourceId(),
                student.getReferralSourceName(),
                student.getReferralSourceCategory(),
                student.getCreatedAt(),
                student.getUpdatedAt(),
                enrollments,
                payments
        );
    }

    private CurrentUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "認証情報を取得できません");
        }

        return new CurrentUser(userDetails.getUser().getId(), userDetails.getUser().getRole());
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
