package com.student.management.repository;

import com.student.management.entity.Enrollment;
import com.student.management.entity.EnrollmentRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EnrollmentMapper {

    void insert(Enrollment enrollment);

    void update(Enrollment enrollment);

    EnrollmentRow findRowById(@Param("id") Long id);

    long countList(@Param("studentId") Long studentId,
                   @Param("courseId") Long courseId,
                   @Param("status") String status,
                   @Param("instructorId") Long instructorId);

    List<EnrollmentRow> findList(@Param("studentId") Long studentId,
                                 @Param("courseId") Long courseId,
                                 @Param("status") String status,
                                 @Param("instructorId") Long instructorId,
                                 @Param("limit") int limit,
                                 @Param("offset") int offset);
}
