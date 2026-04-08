package com.devnear.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI devnearOpenAPI() {
        String jwtSchemeName = "jwtAuth"; // 보안 스키마 이름 설정

        // 1. API 요청 시 인증 헤더를 포함하도록 설정 (SecurityRequirement)
        SecurityRequirement securityRequirement = new SecurityRequirement().addList(jwtSchemeName);

        // 2. JWT 인증 방식 정의 (SecurityScheme)
        SecurityScheme securityScheme = new SecurityScheme()
                .name(jwtSchemeName)
                .type(SecurityScheme.Type.HTTP) // HTTP 방식
                .scheme("bearer")               // bearer 형식
                .bearerFormat("JWT");           // 포맷은 JWT

        return new OpenAPI()
                .info(new Info()
                        .title("Devnear API 명세서")
                        .description("프리랜서 매칭 플랫폼 Devnear의 백엔드 API 문서입니다.")
                        .version("v1.0.0"))
                .addSecurityItem(securityRequirement) // 전역 보안 설정 적용
                .components(new Components().addSecuritySchemes(jwtSchemeName, securityScheme));
    }
}