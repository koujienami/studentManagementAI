package com.student.management.repository;

import com.student.management.entity.HearingItem;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface HearingItemMapper {

    List<HearingItem> findAllOrdered();
}
