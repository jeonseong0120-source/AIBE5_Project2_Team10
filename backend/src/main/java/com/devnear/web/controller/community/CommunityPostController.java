package com.devnear.web.controller.community;

import com.devnear.web.dto.community.*;
import com.devnear.web.service.community.CommunityPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/community/posts")
@RequiredArgsConstructor
public class CommunityPostController {

    private final CommunityPostService communityPostService;

    @PostMapping
    public ResponseEntity<Long> create(@RequestBody CommunityPostCreateRequest request,
                                       Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityPostService.create(request, userId));
    }

    @GetMapping
    public ResponseEntity<CommunityPostPageResponse> findAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "latest") String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(communityPostService.findAll(keyword, sort, pageable));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<CommunityPostResponse> findById(@PathVariable Long postId) {
        return ResponseEntity.ok(communityPostService.findById(postId));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<CommunitySuccessResponse> update(@PathVariable Long postId,
                                                           @RequestBody CommunityPostUpdateRequest request,
                                                           Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        communityPostService.update(postId, request, userId);
        return ResponseEntity.ok(new CommunitySuccessResponse(true));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<CommunitySuccessResponse> delete(@PathVariable Long postId,
                                                           Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        communityPostService.delete(postId, userId);
        return ResponseEntity.ok(new CommunitySuccessResponse(true));
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<CommunityLikeResponse> like(@PathVariable Long postId,
                                                      Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(communityPostService.like(postId, userId));
    }

    @DeleteMapping("/{postId}/like")
    public ResponseEntity<CommunityLikeResponse> cancelLike(@PathVariable Long postId,
                                                            Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(communityPostService.cancelLike(postId, userId));
    }
}