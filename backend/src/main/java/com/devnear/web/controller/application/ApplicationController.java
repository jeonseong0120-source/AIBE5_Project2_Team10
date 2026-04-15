package com.devnear.web.controller.application;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.application.ApplicationRequest;
import com.devnear.web.dto.application.MyApplicationResponse;
import com.devnear.web.service.application.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    /**
     * [FRE-04] 프로젝트 지원하기
     */
    @PostMapping("/applications")
    public ResponseEntity<Map<String, Long>> applyToProject(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ApplicationRequest request) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Long newId = applicationService.applyToProject(user, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", newId));
        } catch (IllegalArgumentException e) {
            // ALREADY_APPLIED 등 중복 지원 실패 시 400에러 반환
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * [FRE-05] 내 지원 내역 목록 보기 (프리랜서 대시보드뷰)
     */
    @GetMapping("/applications/me")
    public ResponseEntity<List<MyApplicationResponse>> getMyApplications(
            @AuthenticationPrincipal User user) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            List<MyApplicationResponse> myApps = applicationService.getMyApplications(user);
            return ResponseEntity.ok(myApps);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    // (CLI-05) 작업 영역
}
