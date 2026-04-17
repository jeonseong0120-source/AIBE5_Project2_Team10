package com.devnear.web.dto.community;

import lombok.Getter;

import java.util.List;

@Getter
public class CommunityPostPageResponse {
    private final List<CommunityPostResponse> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;


    public CommunityPostPageResponse(List<CommunityPostResponse> content,
                                     int page,
                                     int size,
                                     long totalElements,
                                     int totalPages) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }
}