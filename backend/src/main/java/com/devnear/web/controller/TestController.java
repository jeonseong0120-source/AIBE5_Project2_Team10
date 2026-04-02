package com.devnear.web.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
public class TestController {

    // 1. 단순 문자열 테스트 API
    @GetMapping("/api/hello")
    public String hello() {
        return "서버가 아주 건강하게 작동 중입니다! (Handshake Success)";
    }

    // 2. JSON 데이터 테스트 API
    @GetMapping("/api/test-data")
    public Map<String, String> testData() {
        Map<String, String> data = new HashMap<>();
        data.put("status", "success");
        data.put("message", "이 데이터가 보인다면 프론트엔드와 연결할 준비가 끝난 겁니다.");
        return data;
    }
}