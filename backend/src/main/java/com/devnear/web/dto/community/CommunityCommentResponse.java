package com.devnear.web.dto.community;

import com.devnear.web.domain.community.CommunityComment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommunityCommentResponse {
    private final Long id;
    private final Long postId;
    private final Long authorId;
    private final String content;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public CommunityCommentResponse(CommunityComment comment) {
        this.id = comment.getId();
        this.postId = comment.getPostId();
        this.authorId = comment.getAuthorId();
        this.content = comment.getContent();
        this.createdAt = comment.getCreatedAt();
        this.updatedAt = comment.getUpdatedAt();
    }
}
