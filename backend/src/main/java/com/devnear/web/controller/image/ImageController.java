package com.devnear.web.controller.image;

import com.devnear.global.service.CloudinaryService;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.image.ImageUploadResponse;
import com.devnear.web.service.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Cloudinary 이미지 업로드 전용 컨트롤러
 *
 * <pre>
 * POST /api/images/portfolio          - 포트폴리오 이미지 단일 업로드
 * POST /api/images/portfolios/bulk    - 포트폴리오 이미지 다중 업로드 (최대 10장)
 * POST /api/images/profile            - 프로필 이미지 업로드 + User 엔티티에 즉시 반영
 * </pre>
 *
 * 프론트엔드는 이 API를 통해 먼저 이미지 URL을 확보한 뒤,
 * 해당 URL을 포트폴리오 등록/수정 요청 바디(PortfolioRequest)에 담아 보냅니다.
 */
@Tag(name = "Image", description = "Cloudinary 이미지 업로드 API")
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final CloudinaryService cloudinaryService;
    private final UserService       userService;

    // ----------------------------------------------------------
    // 1. 포트폴리오 이미지 단일 업로드
    // ----------------------------------------------------------

    /**
     * 포트폴리오 상세 이미지 또는 썸네일 1장을 Cloudinary에 업로드합니다.
     * <p>
     * 반환된 imageUrl을 PortfolioRequest의 portfolioImages 또는 thumbnailUrl에 넣어 사용하세요.
     */
    @Operation(summary = "포트폴리오 이미지 단일 업로드",
               description = "이미지 1장을 Cloudinary에 업로드하고 URL을 반환합니다. " +
                             "반환된 URL을 포트폴리오 등록/수정 API의 요청 바디에 사용하세요.")
    @PostMapping(value = "/portfolio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse.Single> uploadPortfolioImage(
            @AuthenticationPrincipal User user,
            @RequestPart("file") MultipartFile file) {

        requireAuthenticated(user);

        String url = cloudinaryService.uploadImage(file, "portfolios");
        return ResponseEntity.ok(ImageUploadResponse.Single.of(url));
    }

    // ----------------------------------------------------------
    // 2. 포트폴리오 이미지 다중 업로드 (최대 10장)
    // ----------------------------------------------------------

    /**
     * 포트폴리오 상세 이미지 여러 장을 한 번에 업로드합니다.
     * <p>
     * 반환된 imageUrls 배열을 PortfolioRequest의 portfolioImages에 넣어 사용하세요.
     */
    @Operation(summary = "포트폴리오 이미지 다중 업로드",
               description = "이미지 여러 장(최대 10장)을 Cloudinary에 업로드하고 URL 목록을 반환합니다.")
    @PostMapping(value = "/portfolios/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse.Multi> uploadPortfolioImages(
            @AuthenticationPrincipal User user,
            @RequestPart("files") List<MultipartFile> files) {

        requireAuthenticated(user);

        if (files.size() > 10) {
            throw new IllegalArgumentException("포트폴리오 이미지는 한 번에 최대 10장까지 업로드할 수 있습니다.");
        }

        List<String> urls = cloudinaryService.uploadImages(files, "portfolios");
        return ResponseEntity.ok(ImageUploadResponse.Multi.of(urls));
    }

    // ----------------------------------------------------------
    // 3. 프로필 이미지 업로드 + DB 즉시 반영
    // ----------------------------------------------------------

    /**
     * 로그인한 사용자의 프로필 이미지를 Cloudinary에 업로드하고,
     * User 엔티티의 profileImageUrl을 즉시 업데이트합니다.
     * <p>
     * 별도의 PATCH API 호출 없이 이 API 하나로 업로드 + DB 저장이 모두 처리됩니다.
     */
    @Operation(summary = "프로필 이미지 업로드",
               description = "프로필 이미지를 Cloudinary에 업로드하고 즉시 내 계정에 반영합니다.")
    @PostMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse.Single> uploadProfileImage(
            @AuthenticationPrincipal User user,
            @RequestPart("file") MultipartFile file) {

        requireAuthenticated(user);

        // 1. Cloudinary에 업로드
        String newUrl = cloudinaryService.uploadImage(file, "profiles");

        // 2. 기존 프로필 이미지를 Cloudinary에서 삭제 (있는 경우)
        String oldUrl = user.getProfileImageUrl();
        if (oldUrl != null && !oldUrl.isBlank() && oldUrl.contains("res.cloudinary.com")) {
            cloudinaryService.deleteImage(oldUrl);
        }

        // 3. DB 업데이트
        userService.updateProfileImage(user.getEmail(), newUrl);

        return ResponseEntity.ok(ImageUploadResponse.Single.of(newUrl));
    }

    // ----------------------------------------------------------
    // 내부 헬퍼
    // ----------------------------------------------------------

    private void requireAuthenticated(User user) {
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
    }
}
