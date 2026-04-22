package com.devnear.web.controller.freelancer;

import com.devnear.global.auth.SecurityUser;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.ai.RecommendedProjectResponse;
import com.devnear.web.dto.freelancer.FreelancerProfileRequest;
import com.devnear.web.dto.freelancer.FreelancerProfileResponse;
import com.devnear.web.service.ai.AiRecommendationService;
import com.devnear.web.service.freelancer.FreelancerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

@RestController
// [수정] 프론트엔드의 v1 API 호출 규격과 맞추기 위해 매핑을 확장했습니다!
@RequestMapping(value = {"/api/freelancers", "/api/v1/freelancers"})
@RequiredArgsConstructor
public class FreelancerController {

    private final FreelancerService freelancerService;
    private final AiRecommendationService aiRecommendationService;

    // ==== 내 프로필 관리 ====

    // [조회] 대시보드 내 프로필 요약 정보 로드
    @GetMapping("/me")
    public ResponseEntity<FreelancerProfileResponse> getMyProfile(
            @LoginUser User user) {

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
            @LoginUser User user,
            @Valid @RequestBody FreelancerProfileRequest request) {

        if (user == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(freelancerService.updateMyProfile(user, request));
    }

    // ==== 타인 프로필 탐색 ====

    // [조회] 프리랜서 목록 탐색 (필터 / 정렬 지원)
    @GetMapping
    public ResponseEntity<List<FreelancerProfileResponse>> searchFreelancers(
            @AuthenticationPrincipal SecurityUser principal,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String workStyle) {

        // [수정] 프론트에서 빈 문자열("")을 보낼 때 500 쿼리 에러나 필터 누락이 생기지 않도록 null로 치환
        String safeSkill = (skill != null && skill.trim().isEmpty()) ? null : skill;
        String safeRegion = (region != null && region.trim().isEmpty()) ? null : region;
        String safeSort = (sort != null && sort.trim().isEmpty()) ? null : sort;
        String safeWorkStyle = (workStyle != null && workStyle.trim().isEmpty()) ? null : workStyle;
        // JWT principal은 User가 아니라 SecurityUser — 타입 불일치 시 null이 되어 본인이 목록에 노출됨
        Long excludeUserId = (principal != null) ? principal.getId() : null;

        return ResponseEntity.ok(freelancerService.searchFreelancers(
                safeSkill, safeRegion, safeSort, safeWorkStyle, excludeUserId));
    }

    /**
     * 모집 중 클라이언트 공고를 프로필 스킬 태그 매칭 우선으로 추천합니다.
     */
    @GetMapping("/{id}/recommended-projects")
    public ResponseEntity<List<RecommendedProjectResponse>> getRecommendedProjectsForFreelancer(
            @PathVariable Long id,
            @RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(aiRecommendationService.recommendTopProjectsForFreelancer(id, limit));
    }

    // [조회] 특정 타 프리랜서의 상세 정보 보기
    @GetMapping("/{id}")
    public ResponseEntity<FreelancerProfileResponse> getFreelancerById(@PathVariable Long id) {
        return ResponseEntity.ok(freelancerService.getFreelancerById(id));
    }

    // [수정] 대시보드 상단 '활동 상태' 단독 토글
    @PatchMapping("/status")
    public ResponseEntity<Map<String, String>> updateMyStatus(
            @LoginUser User user,
            @Valid @RequestBody com.devnear.web.dto.freelancer.FreelancerStatusRequest request) {

        if (user == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        freelancerService.updateStatus(user, request.getIsActive());

        return ResponseEntity.ok(Map.of("message", "success"));
    }

    // [삭제] 내 프리랜서 프로필 삭제
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyProfile(
            @LoginUser User user) {

        if (user == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        freelancerService.deleteMyProfile(user);
        return ResponseEntity.noContent().build();
    }
}
