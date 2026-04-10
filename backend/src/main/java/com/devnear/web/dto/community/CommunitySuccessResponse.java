package com.devnear.web.dto.community;

import lombok.Getter;

@Getter
public class CommunitySuccessResponse {
    private final boolean success;

    public CommunitySuccessResponse(boolean success) {
        this.success = success;
    }
}
