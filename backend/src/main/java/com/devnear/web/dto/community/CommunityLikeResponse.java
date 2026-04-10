package com.devnear.web.dto.community;

import lombok.Getter;

@Getter
public class CommunityLikeResponse {
    private final boolean success;
    private final int likeCount;

    public CommunityLikeResponse(boolean success, int likeCount) {
        this.success = success;
        this.likeCount = likeCount;
    }
}
