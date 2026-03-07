package com.student.management.controller;

import com.student.management.dto.referral.ReferralSourceResponse;
import com.student.management.dto.user.UserOptionResponse;
import com.student.management.service.MasterDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MasterDataController {

    private final MasterDataService masterDataService;

    public MasterDataController(MasterDataService masterDataService) {
        this.masterDataService = masterDataService;
    }

    @GetMapping("/referral-sources")
    public ResponseEntity<List<ReferralSourceResponse>> getReferralSources() {
        return ResponseEntity.ok(masterDataService.getReferralSources());
    }

    @GetMapping("/master-data/instructors")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<UserOptionResponse>> getInstructors() {
        return ResponseEntity.ok(masterDataService.getInstructorOptions());
    }
}
