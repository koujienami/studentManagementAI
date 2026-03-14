package com.student.management.repository;

import com.student.management.entity.Student;
import com.student.management.entity.StudentDetail;
import com.student.management.entity.StudentEnrollmentSummary;
import com.student.management.entity.StudentListItem;
import com.student.management.entity.StudentPaymentSummary;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface StudentMapper {

    List<StudentListItem> findAll(@Param("keyword") String keyword,
                                  @Param("status") String status,
                                  @Param("referralSourceId") Long referralSourceId,
                                  @Param("hasUnpaid") Boolean hasUnpaid,
                                  @Param("courseId") Long courseId,
                                  @Param("instructorId") Long instructorId);

    Optional<StudentDetail> findDetailById(@Param("id") Long id,
                                           @Param("instructorId") Long instructorId);

    List<StudentEnrollmentSummary> findEnrollmentSummaries(@Param("studentId") Long studentId);

    List<StudentPaymentSummary> findPaymentSummaries(@Param("studentId") Long studentId);

    void insert(Student student);

    void update(Student student);

    void updateStatus(@Param("id") Long id, @Param("status") String status);

    void deleteById(@Param("id") Long id);

    boolean existsById(@Param("id") Long id);

    boolean existsByEmail(@Param("email") String email);

    boolean existsByEmailExcludingId(@Param("email") String email, @Param("id") Long id);

    boolean hasRelatedRecords(@Param("id") Long id);
}
