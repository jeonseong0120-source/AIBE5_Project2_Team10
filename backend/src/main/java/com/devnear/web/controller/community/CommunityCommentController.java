package com.devnear.web.controller.community;

import com.devnear.web.dto.community.CommunityCommentCreateRequest;
import com.devnear.web.dto.community.CommunityCommentResponse;
import com.devnear.web.dto.community.CommunityCommentUpdateRequest;
import com.devnear.web.dto.community.CommunitySuccessResponse;
import com.devnear.web.service.community.CommunityCommentService;
import com.devnear.web.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CommunityCommentController {

    private final CommunityCommentService communityCommentService;

    @PostMapping("/api/community/comments")
    public ResponseEntity<Long> create(@RequestBody CommunityCommentCreateRequest request,
                                       @LoginUser User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = user.getId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityCommentService.create(request, userId));
    }

    @GetMapping("/api/community/posts/{postId}/comments")
    public ResponseEntity<List<CommunityCommentResponse>> findByPostId(@PathVariable Long postId) {
        return ResponseEntity.ok(communityCommentService.findByPostId(postId));
    }

    @PutMapping("/api/community/comments/{commentId}")
    public ResponseEntity<CommunitySuccessResponse> update(@PathVariable Long commentId,
                                                           @RequestBody CommunityCommentUpdateRequest request,
                                                           @LoginUser User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = user.getId();
        communityCommentService.update(commentId, request, userId);
        return ResponseEntity.ok(new CommunitySuccessResponse(true));
    }

    @DeleteMapping("/api/community/comments/{commentId}")
    public ResponseEntity<CommunitySuccessResponse> delete(@PathVariable Long commentId,
                                                           @LoginUser User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = user.getId();
        communityCommentService.delete(commentId, userId);
        return ResponseEntity.ok(new CommunitySuccessResponse(true));
    }
}