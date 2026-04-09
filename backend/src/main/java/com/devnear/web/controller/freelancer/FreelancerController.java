package com.devnear.web.controller.freelancer;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.freelancer.FreelancerProfileRequest;
import com.devnear.web.dto.freelancer.FreelancerProfileResponse;
import com.devnear.web.service.freelancer.FreelancerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/freelancers")
@RequiredArgsConstructor
public class FreelancerController {

    private final FreelancerService freelancerService;

    // ==== 내 프로필 관리 ====

    // [조회] 대시보드 내 프로필 요약 정보 로드
    @GetMapping("/me")
    public ResponseEntity<FreelancerProfileResponse> getMyProfile(
            @AuthenticationPrincipal User user) {

        // 본래 SecurityConfig에서 차단되어야 할 비회원의 '/me' 조회를
        // Controller 내에서 스스스로 방어(401 Unauthorized 반환)하도록 백업 보안 처리
        if (user == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .build();
        }

        FreelancerProfileResponse response = freelancerService.getMyProfile(user);

        if (response == null) {
            return ResponseEntity.noContent().build();
                    
        }

        return ResponseEntity.ok(response);
    }

    // [수정] 대시보드 내 프로필 일괄 업데이트
    @PutMapping("/me")
    public ResponseEntity<FreelancerProfileResponse> updateMyProfile(
            @AuthenticationPrincipal User user,
            @RequestBody FreelancerProfileRequest request) {

        return ResponseEntity.ok(freelancerService.updateMyProfile(user, request));
    }

    // ==== 타인 프로필 탐색 ====

    // [조회] 프리랜서 목록 탐색 (필터 / 정렬 지원)
    @GetMapping
    public ResponseEntity<List<FreelancerProfileResponse>> searchFreelancers(
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String sort) {

        return ResponseEntity.ok(freelancerService.searchFreelancers(skill, region, sort));
    }

    // [조회] 특정 타 프리랜서의 상세 정보 보기
    @GetMapping("/{id}")
    public ResponseEntity<FreelancerProfileResponse> getFreelancerById(@PathVariable Long id) {
        return ResponseEntity.ok(freelancerService.getFreelancerById(id));
    }

    // [수정] 대시보드 상단 '활동 상태' 단독 토글
    @PatchMapping("/status")
    public ResponseEntity<Map<String, String>> updateMyStatus(
            @AuthenticationPrincipal User user,
            @RequestBody com.devnear.web.dto.freelancer.FreelancerStatusRequest request) {

        freelancerService.updateStatus(user, request.getIsActive());

        return ResponseEntity.ok(Map.of("message", "success"));
    }
}
