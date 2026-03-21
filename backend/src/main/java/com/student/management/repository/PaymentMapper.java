package com.student.management.repository;

import com.student.management.entity.Payment;
import com.student.management.entity.PaymentRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PaymentMapper {

    void insert(Payment payment);

    void update(Payment payment);

    PaymentRow findRowById(@Param("id") Long id);

    long countList(@Param("studentId") Long studentId,
                   @Param("courseId") Long courseId,
                   @Param("status") String status,
                   @Param("instructorId") Long instructorId);

    List<PaymentRow> findList(@Param("studentId") Long studentId,
                              @Param("courseId") Long courseId,
                              @Param("status") String status,
                              @Param("instructorId") Long instructorId,
                              @Param("limit") int limit,
                              @Param("offset") int offset);
}
