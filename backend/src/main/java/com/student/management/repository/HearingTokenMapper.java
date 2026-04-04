package com.student.management.repository;

import com.student.management.entity.HearingToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.Optional;

@Mapper
public interface HearingTokenMapper {

    void insert(HearingToken row);

    Optional<HearingToken> findByToken(@Param("token") String token);

    Optional<HearingToken> findActiveUnusedByStudentId(@Param("studentId") Long studentId);

    void markUsed(@Param("id") Long id, @Param("usedAt") LocalDateTime usedAt);

    void markAllUnusedUsedForStudent(@Param("studentId") Long studentId, @Param("usedAt") LocalDateTime usedAt);
}
