package com.devnear.web.controller.user;

import com.devnear.web.dto.user.OnboardingRequest;
import com.devnear.web.dto.user.TokenResponse;
import com.devnear.web.dto.user.UserInfoResponse;
import com.devnear.web.domain.user.User;
import com.devnear.web.service.user.UserService;
import com.devnear.global.auth.LoginUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus; 
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User", description = "회원 관련 API")
@RestController
@RequestMapping(value = {"/api/users", "/api/v1/users"})
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "온보딩 처리", description = "GUEST 유저가 닉네임과 역할을 선택하여 권한을 승격합니다.")
    @PostMapping("/onboarding")
    public ResponseEntity<TokenResponse> onboarding(
            @LoginUser User user,
            @RequestBody @Valid OnboardingRequest request) {

        // 🎯 [수정] 로그인이 안 된 상태라면 NPE 대신 401을 반환
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        TokenResponse response = userService.onboarding(user.getEmail(), request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "내 정보 조회", description = "현재 로그인된 사용자의 정보를 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> getMyInfo(@LoginUser User user) {

        // 🎯 [수정] 로그인이 안 된 상태라면 NPE 대신 401을 반환
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserInfoResponse response = userService.getUserInfo(user.getEmail());
        return ResponseEntity.ok(response);
    }
}