package com.student.management.service;

import com.student.management.dto.payment.PaymentUpdateRequest;
import com.student.management.entity.PaymentRow;
import com.student.management.exception.ApiException;
import com.student.management.repository.PaymentMapper;
import com.student.management.repository.StudentMapper;
import com.student.management.entity.User;
import com.student.management.security.CustomUserDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentMapper paymentMapper;

    @Mock
    private StudentMapper studentMapper;

    @Mock
    private HearingService hearingService;

    @InjectMocks
    private PaymentService paymentService;

    @BeforeEach
    void setStaffUser() {
        User user = new User();
        user.setId(1L);
        user.setRole("STAFF");
        CustomUserDetails details = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void update_unpaidToPaid_whenStudentProvisional_advancesToPreHearing() {
        PaymentRow unpaid = new PaymentRow();
        unpaid.setId(9L);
        unpaid.setStudentId(100L);
        unpaid.setEnrollmentId(50L);
        unpaid.setCourseId(2L);
        unpaid.setStudentName("山田");
        unpaid.setCourseName("Java");
        unpaid.setAmount(50000);
        unpaid.setDueDate(LocalDate.of(2025, 4, 1));
        unpaid.setPaidDate(null);
        unpaid.setStatus("UNPAID");
        unpaid.setCourseInstructorId(7L);
        unpaid.setCreatedAt(java.time.LocalDateTime.now());
        unpaid.setUpdatedAt(java.time.LocalDateTime.now());

        PaymentRow paid = new PaymentRow();
        paid.setId(9L);
        paid.setStudentId(100L);
        paid.setEnrollmentId(50L);
        paid.setCourseId(2L);
        paid.setStudentName("山田");
        paid.setCourseName("Java");
        paid.setAmount(50000);
        paid.setDueDate(LocalDate.of(2025, 4, 1));
        paid.setPaidDate(LocalDate.of(2025, 3, 15));
        paid.setStatus("PAID");
        paid.setCourseInstructorId(7L);
        paid.setCreatedAt(unpaid.getCreatedAt());
        paid.setUpdatedAt(java.time.LocalDateTime.now());

        when(paymentMapper.findRowById(9L)).thenReturn(unpaid, paid);
        when(studentMapper.findStatusById(100L)).thenReturn("PROVISIONAL");

        PaymentUpdateRequest request = new PaymentUpdateRequest(
                50000,
                LocalDate.of(2025, 4, 1),
                null,
                "PAID"
        );

        paymentService.update(9L, request);

        verify(studentMapper).updateStatus(eq(100L), eq("PRE_HEARING"));
        verify(hearingService).issueTokenIfAbsent(100L);
    }

    @Test
    void update_unpaidToPaid_whenStudentNotProvisional_doesNotChangeStudentStatus() {
        PaymentRow unpaid = baseUnpaidRow();
        PaymentRow paid = basePaidRow();

        when(paymentMapper.findRowById(9L)).thenReturn(unpaid, paid);
        when(studentMapper.findStatusById(100L)).thenReturn("POST_HEARING");

        paymentService.update(9L, new PaymentUpdateRequest(
                50000, LocalDate.of(2025, 4, 1), null, "PAID"));

        verify(studentMapper, never()).updateStatus(anyLong(), anyString());
        verify(hearingService, never()).issueTokenIfAbsent(anyLong());
    }

    @Test
    void update_paidToUnpaid_rejected() {
        PaymentRow paidRow = basePaidRow();
        when(paymentMapper.findRowById(9L)).thenReturn(paidRow);

        assertThatThrownBy(() -> paymentService.update(9L, new PaymentUpdateRequest(
                50000, LocalDate.of(2025, 4, 1), null, "UNPAID")))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void update_instructor_forbidden() {
        User user = new User();
        user.setId(7L);
        user.setRole("INSTRUCTOR");
        CustomUserDetails details = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));

        assertThatThrownBy(() -> paymentService.update(1L, new PaymentUpdateRequest(
                1, LocalDate.now(), null, "PAID")))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    private static PaymentRow baseUnpaidRow() {
        PaymentRow r = new PaymentRow();
        r.setId(9L);
        r.setStudentId(100L);
        r.setEnrollmentId(50L);
        r.setCourseId(2L);
        r.setStudentName("山田");
        r.setCourseName("Java");
        r.setAmount(50000);
        r.setDueDate(LocalDate.of(2025, 4, 1));
        r.setPaidDate(null);
        r.setStatus("UNPAID");
        r.setCourseInstructorId(7L);
        r.setCreatedAt(java.time.LocalDateTime.now());
        r.setUpdatedAt(java.time.LocalDateTime.now());
        return r;
    }

    private static PaymentRow basePaidRow() {
        PaymentRow r = baseUnpaidRow();
        r.setStatus("PAID");
        r.setPaidDate(LocalDate.of(2025, 3, 15));
        return r;
    }
}
