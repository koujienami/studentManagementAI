package com.student.management.service;

import com.student.management.dto.apply.ApplyRequest;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplyServiceTest {

    @Mock
    private StudentMapper studentMapper;

    @Mock
    private EnrollmentMapper enrollmentMapper;

    @Mock
    private PaymentMapper paymentMapper;

    @Mock
    private CourseMapper courseMapper;

    @Mock
    private ReferralSourceMapper referralSourceMapper;

    @InjectMocks
    private ApplyService applyService;

    @Test
    void submit_createsStudentEnrollmentAndPayment() {
        when(studentMapper.existsByEmail("a@example.com")).thenReturn(false);
        when(referralSourceMapper.existsById(1L)).thenReturn(true);

        CourseWithInstructor course = new CourseWithInstructor();
        course.setId(10L);
        course.setName("Java入門");
        course.setPrice(50000);
        when(courseMapper.findById(10L)).thenReturn(Optional.of(course));

        when(studentMapper.insert(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId(100L);
            return null;
        });
        when(enrollmentMapper.insert(any(Enrollment.class))).thenAnswer(inv -> {
            Enrollment e = inv.getArgument(0);
            e.setId(200L);
            return null;
        });
        when(paymentMapper.insert(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(300L);
            return null;
        });

        ApplyRequest request = new ApplyRequest(
                "山田太郎",
                "a@example.com",
                "09012345678",
                10L,
                1L
        );

        var response = applyService.submit(request);

        assertThat(response.studentId()).isEqualTo(100L);
        assertThat(response.enrollmentId()).isEqualTo(200L);
        assertThat(response.paymentId()).isEqualTo(300L);
        assertThat(response.courseName()).isEqualTo("Java入門");
        assertThat(response.amount()).isEqualTo(50000);

        ArgumentCaptor<Student> studentCap = ArgumentCaptor.forClass(Student.class);
        verify(studentMapper).insert(studentCap.capture());
        assertThat(studentCap.getValue().getStatus()).isEqualTo("PROVISIONAL");
        assertThat(studentCap.getValue().getReferralSourceId()).isEqualTo(1L);

        ArgumentCaptor<Enrollment> enCap = ArgumentCaptor.forClass(Enrollment.class);
        verify(enrollmentMapper).insert(enCap.capture());
        assertThat(enCap.getValue().getStudentId()).isEqualTo(100L);
        assertThat(enCap.getValue().getCourseId()).isEqualTo(10L);
        assertThat(enCap.getValue().getStatus()).isEqualTo("ENROLLED");

        ArgumentCaptor<Payment> payCap = ArgumentCaptor.forClass(Payment.class);
        verify(paymentMapper).insert(payCap.capture());
        assertThat(payCap.getValue().getAmount()).isEqualTo(50000);
        assertThat(payCap.getValue().getStatus()).isEqualTo("UNPAID");
    }

    @Test
    void submit_whenEmailExists_throwsConflict() {
        when(studentMapper.existsByEmail("dup@example.com")).thenReturn(true);

        ApplyRequest request = new ApplyRequest(
                "山田",
                "dup@example.com",
                "",
                1L,
                1L
        );

        assertThatThrownBy(() -> applyService.submit(request))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(studentMapper, never()).insert(any());
    }

    @Test
    void submit_whenReferralInvalid_throwsBadRequest() {
        when(studentMapper.existsByEmail("a@example.com")).thenReturn(false);
        when(referralSourceMapper.existsById(99L)).thenReturn(false);

        ApplyRequest request = new ApplyRequest(
                "山田",
                "a@example.com",
                "",
                1L,
                99L
        );

        assertThatThrownBy(() -> applyService.submit(request))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(studentMapper, never()).insert(any());
    }

    @Test
    void submit_whenCourseMissing_throwsNotFound() {
        when(studentMapper.existsByEmail("a@example.com")).thenReturn(false);
        when(referralSourceMapper.existsById(1L)).thenReturn(true);
        when(courseMapper.findById(999L)).thenReturn(Optional.empty());

        ApplyRequest request = new ApplyRequest(
                "山田",
                "a@example.com",
                "",
                999L,
                1L
        );

        assertThatThrownBy(() -> applyService.submit(request))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.NOT_FOUND);

        verify(studentMapper, never()).insert(any());
    }

    @Test
    void listPublicCourses_mapsFromCourseMapper() {
        CourseWithInstructor c = new CourseWithInstructor();
        c.setId(1L);
        c.setName("A");
        c.setDescription("desc");
        c.setPrice(1000);
        when(courseMapper.findAll(null)).thenReturn(List.of(c));

        var list = applyService.listPublicCourses();

        assertThat(list).hasSize(1);
        assertThat(list.get(0).id()).isEqualTo(1L);
        assertThat(list.get(0).name()).isEqualTo("A");
        assertThat(list.get(0).price()).isEqualTo(1000);
    }
}
