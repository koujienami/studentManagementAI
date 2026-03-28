package com.student.management.service;

import com.student.management.dto.apply.ApplyCourseResponse;
import com.student.management.dto.apply.ApplyRequest;
import com.student.management.dto.apply.ApplyResponse;
import com.student.management.entity.CourseWithInstructor;
import com.student.management.entity.Enrollment;
import com.student.management.entity.Payment;
import com.student.management.entity.Student;
import com.student.management.exception.ApiException;
import com.student.management.repository.CourseMapper;
import com.student.management.repository.EnrollmentMapper;
import com.student.management.repository.PaymentMapper;
import com.student.management.repository.ReferralSourceMapper;
import com.student.management.repository.StudentMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ApplyService {

    private static final String STATUS_PROVISIONAL = "PROVISIONAL";
    private static final String ENROLLMENT_ENROLLED = "ENROLLED";
    private static final String PAYMENT_UNPAID = "UNPAID";
    private static final int PAYMENT_DUE_DAYS = 30;
    private static final ZoneId ZONE_TOKYO = ZoneId.of("Asia/Tokyo");

    private final StudentMapper studentMapper;
    private final EnrollmentMapper enrollmentMapper;
    private final PaymentMapper paymentMapper;
    private final CourseMapper courseMapper;
    private final ReferralSourceMapper referralSourceMapper;

    public ApplyService(StudentMapper studentMapper,
                        EnrollmentMapper enrollmentMapper,
                        PaymentMapper paymentMapper,
                        CourseMapper courseMapper,
                        ReferralSourceMapper referralSourceMapper) {
        this.studentMapper = studentMapper;
        this.enrollmentMapper = enrollmentMapper;
        this.paymentMapper = paymentMapper;
        this.courseMapper = courseMapper;
        this.referralSourceMapper = referralSourceMapper;
    }

    public List<ApplyCourseResponse> listPublicCourses() {
        return courseMapper.findAll(null).stream()
                .map(this::toApplyCourseResponse)
                .toList();
    }

    @Transactional
    public ApplyResponse submit(ApplyRequest request) {
        String normalizedEmail = normalize(request.email());
        if (normalizedEmail == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "メールアドレスは必須です");
        }
        if (studentMapper.existsByEmail(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "同じメールアドレスの受講生が既に存在します");
        }
        if (!referralSourceMapper.existsById(request.referralSourceId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "申込経路が存在しません");
        }

        CourseWithInstructor course = courseMapper.findById(request.courseId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "コースが見つかりません"));

        LocalDate today = LocalDate.now(ZONE_TOKYO);
        LocalDate dueDate = today.plusDays(PAYMENT_DUE_DAYS);

        Student student = new Student();
        student.setName(request.name().trim());
        student.setEmail(normalizedEmail);
        student.setPhone(normalize(request.phone()));
        student.setAddress(null);
        student.setBirthdate(null);
        student.setGender(null);
        student.setChatUsername(null);
        student.setStatus(STATUS_PROVISIONAL);
        student.setReferralSourceId(request.referralSourceId());
        studentMapper.insert(student);

        Enrollment enrollment = new Enrollment();
        enrollment.setStudentId(student.getId());
        enrollment.setCourseId(course.getId());
        enrollment.setStartDate(today);
        enrollment.setEndDate(null);
        enrollment.setStatus(ENROLLMENT_ENROLLED);
        enrollmentMapper.insert(enrollment);

        Payment payment = new Payment();
        payment.setStudentId(student.getId());
        payment.setEnrollmentId(enrollment.getId());
        payment.setAmount(course.getPrice());
        payment.setDueDate(dueDate);
        payment.setPaidDate(null);
        payment.setStatus(PAYMENT_UNPAID);
        paymentMapper.insert(payment);

        return new ApplyResponse(
                student.getId(),
                enrollment.getId(),
                payment.getId(),
                course.getName(),
                course.getPrice(),
                dueDate
        );
    }

    private ApplyCourseResponse toApplyCourseResponse(CourseWithInstructor course) {
        return new ApplyCourseResponse(
                course.getId(),
                course.getName(),
                course.getDescription(),
                course.getPrice()
        );
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
