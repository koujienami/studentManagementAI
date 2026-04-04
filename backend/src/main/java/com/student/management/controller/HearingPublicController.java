package com.student.management.controller;

import com.student.management.dto.hearing.HearingAnswerSubmitRequest;
import com.student.management.dto.hearing.HearingSessionResponse;
import com.student.management.service.HearingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 公開ヒアリング API。レート制限は {@link com.student.management.security.HearingRateLimitFilter} を参照。
 */
@RestController
@RequestMapping("/api/hearing")
public class HearingPublicController {

    private final HearingService hearingService;

    public HearingPublicController(HearingService hearingService) {
        this.hearingService = hearingService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<HearingSessionResponse> getSession(@PathVariable String token) {
        return ResponseEntity.ok(hearingService.getSession(token));
    }

    @PostMapping("/{token}/answers")
    public ResponseEntity<Void> submit(@PathVariable String token,
                                         @Valid @RequestBody HearingAnswerSubmitRequest request) {
        hearingService.submitAnswers(token, request);
        return ResponseEntity.noContent().build();
    }
}
