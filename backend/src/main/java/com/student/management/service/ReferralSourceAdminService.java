package com.student.management.service;

import com.student.management.dto.referral.ReferralSourceAdminResponse;
import com.student.management.dto.referral.ReferralSourceRequest;
import com.student.management.entity.ReferralSource;
import com.student.management.exception.ApiException;
import com.student.management.repository.ReferralSourceMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReferralSourceAdminService {

    private final ReferralSourceMapper referralSourceMapper;

    public ReferralSourceAdminService(ReferralSourceMapper referralSourceMapper) {
        this.referralSourceMapper = referralSourceMapper;
    }

    public List<ReferralSourceAdminResponse> getAll() {
        return referralSourceMapper.findAllForAdmin().stream()
                .map(ReferralSourceAdminResponse::from)
                .toList();
    }

    public ReferralSourceAdminResponse get(Long id) {
        return ReferralSourceAdminResponse.from(loadActive(id));
    }

    @Transactional
    public ReferralSourceAdminResponse create(ReferralSourceRequest request) {
        String name = request.name().trim();
        if (referralSourceMapper.existsByName(name)) {
            throw new ApiException(HttpStatus.CONFLICT, "同名の申込経路がすでに存在します");
        }

        ReferralSource source = new ReferralSource();
        source.setName(name);
        source.setCategory(request.category());
        source.setDisplayOrder(request.displayOrder());

        referralSourceMapper.insert(source);

        return ReferralSourceAdminResponse.from(loadActive(source.getId()));
    }

    @Transactional
    public ReferralSourceAdminResponse update(Long id, ReferralSourceRequest request) {
        ReferralSource source = loadActive(id);

        String name = request.name().trim();
        if (referralSourceMapper.existsByNameExceptId(name, id)) {
            throw new ApiException(HttpStatus.CONFLICT, "同名の申込経路がすでに存在します");
        }

        source.setName(name);
        source.setCategory(request.category());
        source.setDisplayOrder(request.displayOrder());

        referralSourceMapper.update(source);

        return ReferralSourceAdminResponse.from(loadActive(id));
    }

    @Transactional
    public void delete(Long id) {
        loadActive(id);
        referralSourceMapper.softDelete(id);
    }

    private ReferralSource loadActive(Long id) {
        ReferralSource source = referralSourceMapper.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "申込経路が見つかりません"));
        if (source.getDeletedAt() != null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "申込経路が見つかりません");
        }
        return source;
    }
}
