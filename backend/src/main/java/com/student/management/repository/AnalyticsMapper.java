package com.student.management.repository;

import com.student.management.dto.analytics.CourseStatItem;
import com.student.management.dto.analytics.MonthlyStatItem;
import com.student.management.dto.analytics.PaymentSummary;
import com.student.management.dto.analytics.ReferralSourceStatItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface AnalyticsMapper {

    List<ReferralSourceStatItem> aggregateByReferralSource(@Param("from") LocalDate from,
                                                           @Param("to") LocalDate to);

    List<CourseStatItem> aggregateByCourse(@Param("from") LocalDate from,
                                           @Param("to") LocalDate to);

    List<MonthlyStatItem> aggregateMonthly(@Param("months") int months);

    PaymentSummary summarizePayments(@Param("from") LocalDate from,
                                     @Param("to") LocalDate to);

    long countNewStudents(@Param("from") LocalDate from,
                          @Param("to") LocalDate to);

    long countActiveEnrollments();
}
