package com.student.management.controller;

import com.student.management.dto.hearing.HearingAnswerRowResponse;
import com.student.management.dto.hearing.HearingTokenIssuedResponse;
import com.student.management.service.HearingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/students")
public class StudentHearingController {

    private final HearingService hearingService;

    public StudentHearingController(HearingService hearingService) {
        this.hearingService = hearingService;
    }

    @GetMapping("/{id}/hearing-tokens")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<HearingTokenIssuedResponse> getActiveHearingToken(@PathVariable Long id) {
        Optional<HearingTokenIssuedResponse> body = hearingService.findActiveToken(id);
        return body.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/{id}/hearing-tokens")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<HearingTokenIssuedResponse> issueHearingToken(@PathVariable Long id) {
        return ResponseEntity.ok(hearingService.rotateToken(id));
    }

    @GetMapping("/{id}/hearing-answers")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'INSTRUCTOR')")
    public ResponseEntity<List<HearingAnswerRowResponse>> listHearingAnswers(@PathVariable Long id) {
        return ResponseEntity.ok(hearingService.listAnswersForStudent(id));
    }
}
