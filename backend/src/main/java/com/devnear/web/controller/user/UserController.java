package com.devnear.web.controller.user;

import com.devnear.web.dto.user.TokenResponse; // 🚨 추가됨
import com.devnear.web.dto.user.UserLoginRequest;
import com.devnear.web.dto.user.UserRegisterRequest;
import com.devnear.web.service.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "User", description = "회원 관련 API")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "회원가입", description = "이메일, 비밀번호 등을 입력받아 회원가입을 진행합니다.")
    @PostMapping("/register")
    public ResponseEntity<Long> register(@RequestBody UserRegisterRequest request) {
        Long userId = userService.register(request);
        return ResponseEntity.ok(userId);
    }

    @Operation(summary = "로그인", description = "이메일과 비밀번호로 로그인을 진행하고 토큰을 발급합니다.")
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody UserLoginRequest request) { // 🚨 반환 타입 변경
        TokenResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }
}