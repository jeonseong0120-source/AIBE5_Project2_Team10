package com.devnear.web.dto.community;

import com.devnear.web.domain.community.CommunityPost;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommunityPostResponse {
    private final Long id;
    private final String title;
    private final String content;
    private final Long authorId;
    private final int viewCount;
    private final int likeCount;
    private final int commentCount;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public CommunityPostResponse(CommunityPost post) {
        this.id = post.getId();
        this.title = post.getTitle();
        this.content = post.getContent();
        this.authorId = post.getAuthorId();
        this.viewCount = post.getViewCount();
        this.likeCount = post.getLikeCount();
        this.commentCount = post.getCommentCount();
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
    }
}
