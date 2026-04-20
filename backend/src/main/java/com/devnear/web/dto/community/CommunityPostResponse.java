package com.devnear.web.dto.community;

import com.devnear.web.domain.community.CommunityPost;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommunityPostResponse {

    private final Long id;
    private final String title;
    private final String content;
    private final Long authorId;
    private final String authorNickname;
    private final int viewCount;
    private final int likeCount;
    private final int commentCount;
    private final boolean isLiked;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public CommunityPostResponse(CommunityPost post, String authorNickname, boolean isLiked) {
        this.id = post.getId();
        this.title = post.getTitle();
        this.content = post.getContent();
        this.authorId = post.getAuthorId();
        this.authorNickname = authorNickname;
        this.viewCount = post.getViewCount();
        this.likeCount = post.getLikeCount();
        this.commentCount = post.getCommentCount();
        this.isLiked = isLiked;
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
    }
}