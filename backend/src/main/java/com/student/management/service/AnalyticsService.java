package com.student.management.service;

import com.student.management.dto.analytics.AnalyticsOverviewResponse;
import com.student.management.dto.analytics.CourseStatItem;
import com.student.management.dto.analytics.MonthlyStatItem;
import com.student.management.dto.analytics.PaymentSummary;
import com.student.management.dto.analytics.ReferralSourceStatItem;
import com.student.management.exception.ApiException;
import com.student.management.repository.AnalyticsMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private static final int DEFAULT_MONTHS = 12;
    private static final int MAX_MONTHS = 36;

    private final AnalyticsMapper analyticsMapper;

    public AnalyticsService(AnalyticsMapper analyticsMapper) {
        this.analyticsMapper = analyticsMapper;
    }

    public List<ReferralSourceStatItem> getReferralSourceStats(LocalDate from, LocalDate to) {
        validateRange(from, to);
        return analyticsMapper.aggregateByReferralSource(from, to);
    }

    public List<CourseStatItem> getCourseStats(LocalDate from, LocalDate to) {
        validateRange(from, to);
        return analyticsMapper.aggregateByCourse(from, to);
    }

    public List<MonthlyStatItem> getMonthlyStats(Integer months) {
        int m = (months == null || months <= 0) ? DEFAULT_MONTHS : Math.min(months, MAX_MONTHS);
        return analyticsMapper.aggregateMonthly(m);
    }

    public PaymentSummary getPaymentSummary(LocalDate from, LocalDate to) {
        validateRange(from, to);
        return analyticsMapper.summarizePayments(from, to);
    }

    public AnalyticsOverviewResponse getOverview(LocalDate from, LocalDate to) {
        validateRange(from, to);
        long newStudents = analyticsMapper.countNewStudents(from, to);
        long activeEnrollments = analyticsMapper.countActiveEnrollments();
        PaymentSummary payments = analyticsMapper.summarizePayments(from, to);
        return new AnalyticsOverviewResponse(newStudents, activeEnrollments, payments);
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "from は to 以前の日付を指定してください");
        }
    }
}
