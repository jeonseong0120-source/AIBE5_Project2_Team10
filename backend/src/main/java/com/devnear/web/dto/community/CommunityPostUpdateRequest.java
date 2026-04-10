package com.devnear.web.dto.community;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CommunityPostUpdateRequest {
    private String title;
    private String content;
}
