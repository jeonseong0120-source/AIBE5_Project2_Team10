package com.devnear.web.controller.bookmark;

import com.devnear.web.domain.user.User;
import com.devnear.web.dto.freelancer.FreelancerProfileResponse;
import com.devnear.web.dto.project.ProjectResponse;
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
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Bookmark", description = "찜 관련 API")
@RestController
@RequestMapping(value = { "/api/bookmarks", "/api/v1/bookmarks" })
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    // ── 프리랜서 찜 (클라이언트 전용) ──

    @Operation(summary = "프리랜서 찜 추가", description = "클라이언트가 프리랜서를 찜합니다.")
    @PostMapping("/freelancers/{freelancerProfileId}")
    public ResponseEntity<Void> addFreelancerBookmark(
            @LoginUser User user,
            @PathVariable Long freelancerProfileId) {
        bookmarkService.addFreelancerBookmark(user, freelancerProfileId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "프리랜서 찜 삭제")
    @DeleteMapping("/freelancers/{freelancerProfileId}")
    public ResponseEntity<Void> removeFreelancerBookmark(
            @LoginUser User user,
            @PathVariable Long freelancerProfileId) {
        bookmarkService.removeFreelancerBookmark(user, freelancerProfileId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "찜한 프리랜서 목록 조회")
    @GetMapping("/freelancers")
    public ResponseEntity<Page<FreelancerProfileResponse>> getBookmarkedFreelancers(
            @LoginUser User user,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(bookmarkService.getBookmarkedFreelancers(user, pageable));
    }

    // ── 프로젝트 찜 (프리랜서 전용) ──

    @Operation(summary = "프로젝트 찜 추가", description = "프리랜서가 프로젝트를 찜합니다.")
    @PostMapping("/projects/{projectId}")
    public ResponseEntity<Void> addProjectBookmark(
            @LoginUser User user,
            @PathVariable Long projectId) {
        bookmarkService.addProjectBookmark(user, projectId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "프로젝트 찜 삭제")
    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<Void> removeProjectBookmark(
            @LoginUser User user,
            @PathVariable Long projectId) {
        bookmarkService.removeProjectBookmark(user, projectId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "찜한 프로젝트 목록 조회")
    @GetMapping("/projects")
    public ResponseEntity<Page<ProjectResponse>> getBookmarkedProjects(
            @LoginUser User user,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(bookmarkService.getBookmarkedProjects(user, pageable));
    }

    // ── 포트폴리오 좋아요 (프리랜서 찜으로 처리) ──

    @Operation(summary = "포트폴리오 좋아요", description = "포트폴리오 작성자를 찜합니다.")
    @PostMapping("/portfolios/{portfolioId}/like")
    public ResponseEntity<Void> likePortfolio(
            @LoginUser User user,
            @PathVariable Long portfolioId) {
        bookmarkService.likePortfolio(user, portfolioId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "포트폴리오 좋아요 취소", description = "포트폴리오 작성자 찜을 취소합니다.")
    @DeleteMapping("/portfolios/{portfolioId}/like")
    public ResponseEntity<Void> unlikePortfolio(
            @LoginUser User user,
            @PathVariable Long portfolioId) {
        bookmarkService.unlikePortfolio(user, portfolioId);
        return ResponseEntity.noContent().build();
    }
}