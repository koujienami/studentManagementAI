package com.student.management.controller;

import com.student.management.dto.apply.ApplyCourseResponse;
import com.student.management.dto.apply.ApplyRequest;
import com.student.management.dto.apply.ApplyResponse;
import com.student.management.dto.referral.ReferralSourceResponse;
import com.student.management.service.ApplyService;
import com.student.management.service.MasterDataService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/apply")
public class ApplyController {

    private final ApplyService applyService;
    private final MasterDataService masterDataService;

    public ApplyController(ApplyService applyService, MasterDataService masterDataService) {
        this.applyService = applyService;
        this.masterDataService = masterDataService;
    }

    @GetMapping("/courses")
    public ResponseEntity<List<ApplyCourseResponse>> listCourses() {
        return ResponseEntity.ok(applyService.listPublicCourses());
    }

    @GetMapping("/referral-sources")
    public ResponseEntity<List<ReferralSourceResponse>> listReferralSources() {
        return ResponseEntity.ok(masterDataService.getReferralSources());
    }

    @PostMapping
    public ResponseEntity<ApplyResponse> apply(@Valid @RequestBody ApplyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applyService.submit(request));
    }
}
