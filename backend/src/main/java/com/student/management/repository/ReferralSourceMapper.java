package com.student.management.repository;

import com.student.management.entity.ReferralSource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ReferralSourceMapper {

    /** 公開・選択肢用（論理削除済みを除外） */
    List<ReferralSource> findAll();

    /** 管理画面用（論理削除済みも含めて返す） */
    List<ReferralSource> findAllForAdmin();

    Optional<ReferralSource> findById(@Param("id") Long id);

    /** 公開向けの存在確認（論理削除済みは無効） */
    boolean existsById(@Param("id") Long id);

    boolean existsByName(@Param("name") String name);

    boolean existsByNameExceptId(@Param("name") String name, @Param("id") Long id);

    boolean isReferencedByStudent(@Param("id") Long id);

    void insert(ReferralSource source);

    int update(ReferralSource source);

    int softDelete(@Param("id") Long id);
}
