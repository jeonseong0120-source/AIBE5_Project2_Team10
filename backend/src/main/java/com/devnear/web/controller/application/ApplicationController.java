package com.devnear.web.controller.application;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.application.ApplicantResponse;
import com.devnear.web.dto.application.ApplicationRequest;
import com.devnear.web.dto.application.ApplicationStatusUpdateRequest;
import com.devnear.web.dto.application.MyApplicationResponse;
import com.devnear.web.service.application.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Application", description = "프로젝트 지원/지원자 관리 API")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    /**
     * [FRE-04] 프로젝트 지원하기
     */
    @Operation(summary = "프로젝트 지원", description = "프리랜서가 프로젝트에 지원하며, 지원 시점 기술 스택 기준 매칭률을 저장합니다.")
    @PostMapping("/applications")
    public ResponseEntity<Map<String, Long>> applyToProject(
            @LoginUser User user,
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
    @Operation(summary = "내 지원 내역 조회", description = "프리랜서 본인의 프로젝트 지원 내역을 최신순으로 조회합니다.")
    @GetMapping("/applications/me")
    public ResponseEntity<List<MyApplicationResponse>> getMyApplications(
            @LoginUser User user) {

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

    /**
     * [CLI] 내 프로젝트 지원자 목록을 매칭률 높은 순으로 조회
     */
    @Operation(summary = "내 프로젝트 지원자 조회", description = "클라이언트가 자신의 프로젝트 지원자 목록을 매칭률 내림차순으로 조회합니다.")
    @GetMapping("/projects/{projectId}/applications")
    public ResponseEntity<List<ApplicantResponse>> getApplicantsForMyProject(
            @LoginUser User user,
            @PathVariable Long projectId) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<ApplicantResponse> applicants = applicationService.getApplicantsForMyProject(user, projectId);
        return ResponseEntity.ok(applicants);
    }

    /**
     * [CLI] 지원 상태를 수락/거절로 업데이트
     */
    @Operation(summary = "지원 상태 변경", description = "클라이언트가 지원 상태를 ACCEPTED 또는 REJECTED로 변경합니다.")
    @PatchMapping("/applications/{applicationId}/status")
    public ResponseEntity<Void> updateApplicationStatus(
            @LoginUser User user,
            @PathVariable Long applicationId,
            @Valid @RequestBody ApplicationStatusUpdateRequest request) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        applicationService.updateApplicationStatus(user, applicationId, request);
        return ResponseEntity.noContent().build();
    }

}
