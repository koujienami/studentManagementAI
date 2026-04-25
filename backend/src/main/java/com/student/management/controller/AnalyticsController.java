package com.student.management.controller;

import com.student.management.dto.analytics.AnalyticsOverviewResponse;
import com.student.management.dto.analytics.CourseStatItem;
import com.student.management.dto.analytics.MonthlyStatItem;
import com.student.management.dto.analytics.PaymentSummary;
import com.student.management.dto.analytics.ReferralSourceStatItem;
import com.student.management.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<AnalyticsOverviewResponse> overview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(analyticsService.getOverview(from, to));
    }

    @GetMapping("/referral-sources")
    public ResponseEntity<List<ReferralSourceStatItem>> referralSources(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(analyticsService.getReferralSourceStats(from, to));
    }

    @GetMapping("/courses")
    public ResponseEntity<List<CourseStatItem>> courses(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(analyticsService.getCourseStats(from, to));
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<MonthlyStatItem>> monthly(
            @RequestParam(required = false) Integer months) {
        return ResponseEntity.ok(analyticsService.getMonthlyStats(months));
    }

    @GetMapping("/payments/summary")
    public ResponseEntity<PaymentSummary> paymentsSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(analyticsService.getPaymentSummary(from, to));
    }
}
