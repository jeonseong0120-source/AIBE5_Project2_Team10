package com.devnear.web.controller.portfolio;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.portfolio.PortfolioRequest;
import com.devnear.web.dto.portfolio.PortfolioResponse;
import com.devnear.web.service.portfolio.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    // [등록] POST /api/portfolios
    @PostMapping
    public ResponseEntity<Map<String, Long>> createPortfolio(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PortfolioRequest request) {

        // 로그인 안 된 상태 차단 (401 방어막)
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long newId = portfolioService.createPortfolio(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", newId));
    }

    // [조회] GET /api/portfolios?userId={userId}
    @GetMapping
    public ResponseEntity<List<PortfolioResponse>> getPortfolios(
            @RequestParam("userId") Long userId) {

        // 특정 회원의 포트폴리오 목록 반환
        return ResponseEntity.ok(portfolioService.getPortfoliosByUserId(userId));
    }

    // [삭제] DELETE /api/portfolios/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deletePortfolio(
            @AuthenticationPrincipal User user,
            @PathVariable("id") Long id) {

        // 로그인 안 된 상태 차단 (401 방어막)
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        portfolioService.deletePortfolio(user, id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // [수정] PUT /api/portfolios/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> updatePortfolio(
            @AuthenticationPrincipal User user,
            @PathVariable("id") Long id,
            @Valid @RequestBody PortfolioRequest request) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        portfolioService.updatePortfolio(user, id, request);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // [내 포트폴리오 조회] GET /api/portfolios/me
    @GetMapping("/me")
    public ResponseEntity<List<PortfolioResponse>> getMyPortfolios(
            @AuthenticationPrincipal User user) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 로그인한 유지의 ID를 기반으로 목록 조회
        return ResponseEntity.ok(portfolioService.getPortfoliosByUserId(user.getId()));
    }
}
