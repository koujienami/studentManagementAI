package com.student.management.controller;

import com.student.management.dto.referral.ReferralSourceAdminResponse;
import com.student.management.dto.referral.ReferralSourceRequest;
import com.student.management.service.ReferralSourceAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/referral-sources")
public class ReferralSourceAdminController {

    private final ReferralSourceAdminService referralSourceAdminService;

    public ReferralSourceAdminController(ReferralSourceAdminService referralSourceAdminService) {
        this.referralSourceAdminService = referralSourceAdminService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<ReferralSourceAdminResponse>> list() {
        return ResponseEntity.ok(referralSourceAdminService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ReferralSourceAdminResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(referralSourceAdminService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReferralSourceAdminResponse> create(
            @Valid @RequestBody ReferralSourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(referralSourceAdminService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReferralSourceAdminResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ReferralSourceRequest request) {
        return ResponseEntity.ok(referralSourceAdminService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        referralSourceAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
