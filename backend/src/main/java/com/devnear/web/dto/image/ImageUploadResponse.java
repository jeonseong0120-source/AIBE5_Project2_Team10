package com.devnear.web.dto.image;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * Cloudinary 이미지 업로드 응답 DTO
 */
public class ImageUploadResponse {

    /** 단일 이미지 업로드 응답 */
    @Getter
    @AllArgsConstructor
    public static class Single {
        private String imageUrl;

        public static Single of(String url) {
            return new Single(url);
        }
    }

    /** 다중 이미지 업로드 응답 */
    @Getter
    @AllArgsConstructor
    public static class Multi {
        private List<String> imageUrls;

        public static Multi of(List<String> urls) {
            return new Multi(urls);
        }
    }
}
