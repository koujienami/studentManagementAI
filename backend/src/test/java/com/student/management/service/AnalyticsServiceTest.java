package com.student.management.service;

import com.student.management.dto.analytics.PaymentSummary;
import com.student.management.exception.ApiException;
import com.student.management.repository.AnalyticsMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private AnalyticsMapper analyticsMapper;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    void getOverview_returnsAggregates() {
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 4, 30);
        when(analyticsMapper.countNewStudents(from, to)).thenReturn(15L);
        when(analyticsMapper.countActiveEnrollments()).thenReturn(42L);
        when(analyticsMapper.summarizePayments(from, to))
                .thenReturn(new PaymentSummary(100_000L, 30_000L, 5L, 2L));

        var overview = analyticsService.getOverview(from, to);

        assertThat(overview.newStudents()).isEqualTo(15L);
        assertThat(overview.activeEnrollments()).isEqualTo(42L);
        assertThat(overview.payments().totalPaid()).isEqualTo(100_000L);
    }

    @Test
    void getOverview_whenFromAfterTo_throwsBadRequest() {
        LocalDate from = LocalDate.of(2026, 4, 1);
        LocalDate to = LocalDate.of(2026, 1, 1);

        assertThatThrownBy(() -> analyticsService.getOverview(from, to))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(analyticsMapper, never()).countNewStudents(any(), any());
    }

    @Test
    void getMonthlyStats_clampsToMaximum() {
        when(analyticsMapper.aggregateMonthly(36)).thenReturn(java.util.List.of());

        analyticsService.getMonthlyStats(999);

        verify(analyticsMapper).aggregateMonthly(36);
    }

    @Test
    void getMonthlyStats_defaultsTo12_whenNullOrZero() {
        when(analyticsMapper.aggregateMonthly(12)).thenReturn(java.util.List.of());

        analyticsService.getMonthlyStats(null);
        analyticsService.getMonthlyStats(0);

        verify(analyticsMapper, org.mockito.Mockito.times(2)).aggregateMonthly(12);
    }
}
