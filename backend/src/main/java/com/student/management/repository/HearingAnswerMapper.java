package com.student.management.repository;

import com.student.management.entity.HearingAnswerView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface HearingAnswerMapper {

    void upsert(@Param("studentId") Long studentId,
                @Param("hearingItemId") Long hearingItemId,
                @Param("answer") String answer,
                @Param("answeredAt") LocalDateTime answeredAt);

    List<HearingAnswerView> findByStudentId(@Param("studentId") Long studentId);
}
