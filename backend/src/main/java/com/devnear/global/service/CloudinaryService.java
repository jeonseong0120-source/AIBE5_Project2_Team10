package com.devnear.global.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Cloudinary 공통 이미지 업로드/삭제 서비스
 * - 포트폴리오 이미지, 프로필 이미지 등 모든 도메인이 공유하는 범용 업로드 로직
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.upload-folder:devnear}")
    private String uploadFolder;

    // ======================================================
    // [단일 이미지 업로드]
    // ======================================================

    /**
     * 단일 이미지를 Cloudinary에 업로드하고, 업로드된 URL을 반환합니다.
     *
     * @param file      업로드할 MultipartFile
     * @param subFolder Cloudinary 내 서브 폴더 (예: "portfolios", "profiles")
     * @return 업로드된 이미지의 secure_url
     */
    public String uploadImage(MultipartFile file, String subFolder) {
        validateImageFile(file);

        try {
            String folder = uploadFolder + "/" + subFolder;
            String publicId = folder + "/" + UUID.randomUUID();

            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "public_id",       publicId,
                            "resource_type",   "image",
                            "overwrite",       false,
                            "unique_filename", false
                    )
            );

            String url = (String) result.get("secure_url");
            log.info("[Cloudinary] 이미지 업로드 성공: {}", url);
            return url;

        } catch (IOException e) {
            log.error("[Cloudinary] 이미지 업로드 실패", e);
            throw new RuntimeException("이미지 업로드 중 오류가 발생했습니다.", e);
        }
    }

    // ======================================================
    // [다중 이미지 업로드]
    // ======================================================

    /**
     * 여러 이미지를 Cloudinary에 순서대로 업로드하고, URL 목록을 반환합니다.
     *
     * @param files     업로드할 MultipartFile 목록
     * @param subFolder Cloudinary 내 서브 폴더 (예: "portfolios")
     * @return 업로드된 이미지 URL 목록 (순서 보장)
     */
    public List<String> uploadImages(List<MultipartFile> files, String subFolder) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("업로드할 이미지가 없습니다.");
        }

        List<String> uploadedUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            uploadedUrls.add(uploadImage(file, subFolder));
        }
        return uploadedUrls;
    }

    // ======================================================
    // [이미지 삭제]
    // ======================================================

    /**
     * Cloudinary에서 이미지를 삭제합니다.
     * secure_url에서 public_id를 추출하여 삭제 요청을 보냅니다.
     *
     * @param imageUrl 삭제할 이미지의 Cloudinary secure_url
     */
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        try {
            String publicId = extractPublicIdFromUrl(imageUrl);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("[Cloudinary] 이미지 삭제 성공: publicId={}", publicId);
        } catch (IOException e) {
            // 삭제 실패는 비즈니스 흐름을 막지 않음 — 로그만 기록
            log.error("[Cloudinary] 이미지 삭제 실패: url={}", imageUrl, e);
        }
    }

    // ======================================================
    // [내부 유틸]
    // ======================================================

    /**
     * Cloudinary secure_url에서 public_id를 추출합니다.
     * 예) https://res.cloudinary.com/{cloud_name}/image/upload/v12345/{folder}/{uuid}
     *   → {folder}/{uuid}
     */
    private String extractPublicIdFromUrl(String url) {
        // "/upload/" 뒤의 경로에서 버전 prefix(v숫자/)를 제거하고, 확장자를 제거
        String marker = "/upload/";
        int markerIdx = url.indexOf(marker);
        if (markerIdx < 0) {
            throw new IllegalArgumentException("유효하지 않은 Cloudinary URL입니다: " + url);
        }
        String afterUpload = url.substring(markerIdx + marker.length()); // e.g. "v1234/devnear/profiles/uuid.jpg"

        // 버전 prefix 제거 (v숫자/ 형태)
        String withoutVersion = afterUpload.replaceFirst("^v\\d+/", ""); // "devnear/profiles/uuid.jpg"

        // 확장자 제거
        int dotIdx = withoutVersion.lastIndexOf('.');
        return dotIdx >= 0 ? withoutVersion.substring(0, dotIdx) : withoutVersion;
    }

    /**
     * 업로드 전 파일 유효성 검사
     */
    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일을 선택해주세요.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다. (jpg, png, gif, webp 등)");
        }

        // 10MB 제한
        long maxSize = 10L * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("파일 크기는 10MB 이하여야 합니다.");
        }
    }
}
