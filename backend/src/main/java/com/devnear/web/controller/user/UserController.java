package com.devnear.web.controller.user;

import com.devnear.web.dto.user.OnboardingRequest;
import com.devnear.web.dto.user.TokenResponse;
import com.devnear.web.dto.user.UserInfoResponse;
// 기존 임포트들 사이에 추가!
import com.devnear.web.domain.user.User;
import com.devnear.web.service.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "User", description = "회원 관련 API")
@RestController
@RequestMapping(value = {"/api/users", "/api/v1/users"})
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "온보딩 처리", description = "GUEST 유저가 닉네임과 역할을 선택하여 권한을 승격합니다.")
    @PostMapping("/onboarding")
    public ResponseEntity<TokenResponse> onboarding(
            @LoginUser User user, // 👈 [수정] UserDetails -> User
            @RequestBody @Valid OnboardingRequest request) {

        // user.getEmail() 혹은 user.getId()를 바로 쓸 수 있습니다!
        TokenResponse response = userService.onboarding(user.getEmail(), request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "내 정보 조회", description = "현재 로그인된 사용자의 정보를 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> getMyInfo(@LoginUser User user) { // 👈 [수정] UserDetails -> User

        // 이제 user는 진짜 DB에서 불러온 엔티티입니다! ㅋㅋㅋ
        UserInfoResponse response = userService.getUserInfo(user.getEmail());
        return ResponseEntity.ok(response);
    }
}