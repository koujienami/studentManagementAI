package com.student.management.service;

import com.student.management.dto.referral.ReferralSourceResponse;
import com.student.management.dto.user.UserOptionResponse;
import com.student.management.repository.ReferralSourceMapper;
import com.student.management.repository.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MasterDataService {

    private static final String ROLE_INSTRUCTOR = "INSTRUCTOR";

    private final ReferralSourceMapper referralSourceMapper;
    private final UserMapper userMapper;

    public MasterDataService(ReferralSourceMapper referralSourceMapper,
                             UserMapper userMapper) {
        this.referralSourceMapper = referralSourceMapper;
        this.userMapper = userMapper;
    }

    public List<ReferralSourceResponse> getReferralSources() {
        return referralSourceMapper.findAll().stream()
                .map(source -> new ReferralSourceResponse(
                        source.getId(),
                        source.getName(),
                        source.getCategory()
                ))
                .toList();
    }

    public List<UserOptionResponse> getInstructorOptions() {
        return userMapper.findByRole(ROLE_INSTRUCTOR).stream()
                .map(UserOptionResponse::from)
                .toList();
    }
}
