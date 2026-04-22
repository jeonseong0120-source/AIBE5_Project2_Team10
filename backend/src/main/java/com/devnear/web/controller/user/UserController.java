package com.devnear.web.controller.user;

import com.devnear.web.dto.user.OnboardingRequest;
import com.devnear.web.dto.user.TokenResponse;
import com.devnear.web.dto.user.UserInfoResponse;
import com.devnear.web.service.user.AccountWithdrawalService;
import com.devnear.web.service.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
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
    private final AccountWithdrawalService accountWithdrawalService;

    @Operation(summary = "온보딩 처리", description = "GUEST 유저가 닉네임과 역할을 선택하여 권한을 승격합니다.")
    @PostMapping("/onboarding")
    public ResponseEntity<TokenResponse> onboarding(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid OnboardingRequest request) {
        
        // [보고] UserService를 통해 DB 업데이트 및 새 JWT 토큰(권한 승격됨)을 발급받아 반환합니다.
        TokenResponse response = userService.onboarding(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "내 정보 조회", description = "현재 로그인된 사용자의 정보를 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> getMyInfo(@AuthenticationPrincipal UserDetails userDetails) {
        UserInfoResponse response = userService.getUserInfo(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "회원 탈퇴", description = "역할별 종료 조건을 만족한 경우에만 계정을 비활성화하고 개인정보를 제거합니다.")
    @DeleteMapping("/me/account")
    public ResponseEntity<Void> withdrawAccount(@AuthenticationPrincipal UserDetails userDetails) {
        accountWithdrawalService.withdrawByEmail(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
