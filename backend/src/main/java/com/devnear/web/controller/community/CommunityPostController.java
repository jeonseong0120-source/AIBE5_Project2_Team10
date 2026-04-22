package com.devnear.web.controller.community;

import com.devnear.web.dto.community.*;
import com.devnear.web.service.community.CommunityPostService;
import com.devnear.web.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/community/posts")
@RequiredArgsConstructor
public class CommunityPostController {

    private final CommunityPostService communityPostService;

    @PostMapping
    public ResponseEntity<Long> create(@RequestBody CommunityPostCreateRequest request,
                                       @LoginUser User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = user.getId();
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
    public ResponseEntity<CommunityPostResponse> findById(@PathVariable Long postId,
                                                          @LoginUser User user) {
        Long userId = (user != null) ? user.getId() : null;
        return ResponseEntity.ok(communityPostService.findById(postId, userId));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<CommunitySuccessResponse> update(@PathVariable Long postId,
                                                           @RequestBody CommunityPostUpdateRequest request,
                                                           @LoginUser User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = user.getId();
        communityPostService.update(postId, request, userId);
        return ResponseEntity.ok(new CommunitySuccessResponse(true));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<CommunitySuccessResponse> delete(@PathVariable Long postId,
                                                           @LoginUser User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = user.getId();
        communityPostService.delete(postId, userId);
        return ResponseEntity.ok(new CommunitySuccessResponse(true));
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<CommunityLikeResponse> like(@PathVariable Long postId,
                                                      @LoginUser User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = user.getId();
        return ResponseEntity.ok(communityPostService.like(postId, userId));
    }

    @DeleteMapping("/{postId}/like")
    public ResponseEntity<CommunityLikeResponse> cancelLike(@PathVariable Long postId,
                                                            @LoginUser User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = user.getId();
        return ResponseEntity.ok(communityPostService.cancelLike(postId, userId));
    }
}