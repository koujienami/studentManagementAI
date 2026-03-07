package com.student.management.service;

import com.student.management.dto.referral.ReferralSourceResponse;
import com.student.management.dto.user.UserOptionResponse;
import com.student.management.repository.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MasterDataService {

    private static final String ROLE_INSTRUCTOR = "INSTRUCTOR";

    private static final List<ReferralSourceResponse> REFERRAL_SOURCES = List.of(
            new ReferralSourceResponse(1L, "公式サイト", "WEB"),
            new ReferralSourceResponse(2L, "広告", "AD"),
            new ReferralSourceResponse(3L, "SNS", "SNS"),
            new ReferralSourceResponse(4L, "紹介", "REFERRAL"),
            new ReferralSourceResponse(5L, "その他", "OTHER")
    );

    private final UserMapper userMapper;

    public MasterDataService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public List<ReferralSourceResponse> getReferralSources() {
        return REFERRAL_SOURCES;
    }

    public List<UserOptionResponse> getInstructorOptions() {
        return userMapper.findByRole(ROLE_INSTRUCTOR).stream()
                .map(UserOptionResponse::from)
                .toList();
    }
}
