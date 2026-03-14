package com.student.management.repository;

import com.student.management.entity.ReferralSource;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ReferralSourceMapper {

    List<ReferralSource> findAll();

    boolean existsById(Long id);
}
