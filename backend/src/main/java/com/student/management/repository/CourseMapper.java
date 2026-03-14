package com.student.management.repository;

import com.student.management.entity.Course;
import com.student.management.entity.CourseWithInstructor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface CourseMapper {

    List<CourseWithInstructor> findAll(@Param("keyword") String keyword);

    Optional<CourseWithInstructor> findById(@Param("id") Long id);

    int insert(Course course);

    int update(Course course);

    int deleteById(@Param("id") Long id);

    boolean existsById(@Param("id") Long id);

    boolean hasEnrollments(@Param("id") Long id);
}
