package com.devnear.web.controller;

import com.devnear.web.domain.user.User; // 마스터의 User 엔티티
import org.springframework.security.core.annotation.AuthenticationPrincipal; // 추가
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
public class TestController {

    @GetMapping("/api/test-data")
    public Map<String, Object> testData(@AuthenticationPrincipal User user) {
        Map<String, Object> data = new HashMap<>();

        // 유저가 null인 경우에 대한 방어 로직 추가
        if (user == null) {
            data.put("status", "error");
            data.put("message", "인증된 사용자 정보를 찾을 수 없습니다.");
            return data;
        }

        data.put("status", "success");
        data.put("loginUserEmail", user.getEmail());
        data.put("message", "보안 확인 및 데이터 로드 완료!");
        return data;
    }
}