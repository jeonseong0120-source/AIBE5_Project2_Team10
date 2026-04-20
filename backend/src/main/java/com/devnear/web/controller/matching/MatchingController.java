package com.devnear.web.controller.matching;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.devnear.web.service.matching.MatchingService;
import com.devnear.web.dto.matching.FreelancerMatchingResponse;

// 🎯 Swagger 전용 어노테이션 Import (SpringDoc 기준)
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "매칭 API", description = "프로젝트 기반 프리랜서 매칭 및 추천 API")
@RestController
@RequestMapping("/api/v1/matchings")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;

    // 🎯 1. Operation 어노테이션으로 API 설명 추가
    @Operation(summary = "프로젝트 맞춤형 프리랜서 탐색", description = "해당 프로젝트의 요구 스킬, 지역, 평점 등을 기반으로 AI 매칭 점수를 계산하여 상위 프리랜서 목록을 반환합니다.")
    @GetMapping("/projects/{projectId}")
    public ResponseEntity<List<FreelancerMatchingResponse>> getMatchingResults( // 🎯 2. <?> 대신 정확한 DTO 리스트 타입 명시!
                                                                                @PathVariable Long projectId,
                                                                                Pageable pageable) {

        List<FreelancerMatchingResponse> results = matchingService.getMatchingFreelancers(projectId, pageable);
        return ResponseEntity.ok(results);
    }
}