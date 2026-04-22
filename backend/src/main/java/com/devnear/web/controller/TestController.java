package com.devnear.web.controller;

import com.devnear.web.domain.user.User;
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
public class TestController {

    /**
     * [테스트 1] 공통 인증 테스트 (기존 유지)
     * SecurityConfig의 .anyRequest().authenticated()에 의해 로그인만 하면 누구나 접근 가능
     */
    @GetMapping("/api/test-data")
    public Map<String, Object> testData(@LoginUser User user) {
        return getResponse(user, "보안 확인 및 공통 데이터 로드 성공ㅊㅋ");
    }

    /**
     * [테스트 2] 프리랜서 전용 구역 테스트 (신규)
     * SecurityConfig의 .hasAnyRole("FREELANCER", "BOTH") 적용 확인용
     */
    @GetMapping("/api/freelancer/test")
    public Map<String, Object> freelancerOnly(@LoginUser User user) {
        return getResponse(user, "프리랜서(또는 겸업자) 전용 구역 통과ㅊㅋ");
    }

    /**
     * [테스트 3] 클라이언트 전용 구역 테스트 (신규)
     * SecurityConfig의 .hasAnyRole("CLIENT", "BOTH") 적용 확인용
     */
    @GetMapping("/api/client/test")
    public Map<String, Object> clientOnly(@LoginUser User user) {
        return getResponse(user, "클라이언트(또는 겸업자) 전용 구역 통과ㅊㅋ");
    }

    // 공통 응답 생성 로직 (마스터의 기존 방어 로직 포함)
    private Map<String, Object> getResponse(User user, String message) {
        Map<String, Object> data = new HashMap<>();
        if (user == null) {
            data.put("status", "error");
            data.put("message", "인증된 사용자 정보를 찾을 수 없습니다.");
            return data;
        }
        data.put("status", "success");
        data.put("email", user.getEmail());
        data.put("role", user.getRole()); // 현재 어떤 권한으로 들어왔는지 확인!
        data.put("message", message);
        return data;
    }
}