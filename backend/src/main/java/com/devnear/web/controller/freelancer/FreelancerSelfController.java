package com.devnear.web.controller.freelancer;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.ai.RecommendedProjectResponse;
import com.devnear.web.exception.ResourceNotFoundException;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.service.ai.AiRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 로그인한 프리랜서 본인 기준 API ({@code /api/v1/freelancer/**} → FREELANCER / BOTH).
 */
@RestController
@RequestMapping(value = {"/api/freelancer", "/api/v1/freelancer"})
@RequiredArgsConstructor
public class FreelancerSelfController {

    private final FreelancerProfileRepository freelancerProfileRepository;
    private final AiRecommendationService aiRecommendationService;

    @GetMapping("/me/recommended-projects")
    public ResponseEntity<List<RecommendedProjectResponse>> getMyRecommendedProjects(
            @LoginUser User user,
            @RequestParam(required = false) Integer limit) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        FreelancerProfile profile = freelancerProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("프리랜서 프로필이 등록되어 있지 않습니다."));

        return ResponseEntity.ok(
                aiRecommendationService.recommendTopProjectsForFreelancer(profile.getId(), limit)
        );
    }
}
