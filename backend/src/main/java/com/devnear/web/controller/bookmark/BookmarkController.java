package com.devnear.web.controller.bookmark;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.freelancer.FreelancerProfileResponse;
import com.devnear.web.dto.portfolio.PortfolioResponse;
import com.devnear.web.service.bookmark.BookmarkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Bookmark", description = "찜 관련 API")
@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @Operation(summary = "프리랜서 찜 추가")
    @PostMapping("/freelancers/{freelancerProfileId}")
    public ResponseEntity<Void> addFreelancerBookmark(
            @AuthenticationPrincipal User user,
            @PathVariable Long freelancerProfileId) {
        bookmarkService.addFreelancerBookmark(user, freelancerProfileId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "프리랜서 찜 삭제")
    @DeleteMapping("/freelancers/{freelancerProfileId}")
    public ResponseEntity<Void> removeFreelancerBookmark(
            @AuthenticationPrincipal User user,
            @PathVariable Long freelancerProfileId) {
        bookmarkService.removeFreelancerBookmark(user, freelancerProfileId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "찜한 프리랜서 목록 조회")
    @GetMapping("/freelancers")
    public ResponseEntity<Page<FreelancerProfileResponse>> getBookmarkedFreelancers(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(bookmarkService.getBookmarkedFreelancers(user, pageable));
    }

    @Operation(summary = "포트폴리오 좋아요", description = "포트폴리오 작성자를 찜합니다.")
    @PostMapping("/portfolios/{portfolioId}/like")
    public ResponseEntity<Void> likePortfolio(
            @AuthenticationPrincipal User user,
            @PathVariable Long portfolioId) {
        bookmarkService.likePortfolio(user, portfolioId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "포트폴리오 좋아요 취소", description = "포트폴리오 작성자 찜을 취소합니다.")
    @DeleteMapping("/portfolios/{portfolioId}/like")
    public ResponseEntity<Void> unlikePortfolio(
            @AuthenticationPrincipal User user,
            @PathVariable Long portfolioId) {
        bookmarkService.unlikePortfolio(user, portfolioId);
        return ResponseEntity.noContent().build();
    }
}