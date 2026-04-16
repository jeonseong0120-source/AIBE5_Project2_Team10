package com.devnear.global.config;

import com.devnear.global.auth.JwtAuthenticationFilter;
import com.devnear.global.auth.JwtTokenProvider;
import com.devnear.global.auth.OAuth2SuccessHandler;
import com.devnear.web.service.auth.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED))
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/auth/**", "/api/v1/auth/**", "/swagger-ui/**", "/v3/api-docs/**", "/login/**", "/oauth2/**").permitAll()
                        
                        // [추가] 커뮤니티(Community) 조회 권한 추가 (명세서 준수: 누구나 조회 가능)
                        .requestMatchers(HttpMethod.GET, "/api/freelancers/**", "/api/v1/freelancers/**", "/api/projects/**", "/api/v1/projects/**", "/api/portfolios/**", "/api/v1/portfolios/**", "/api/skills/**", "/api/v1/skills/**", "/api/community/**", "/api/v1/community/**").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/users/onboarding", "/api/v1/users/onboarding", "/api/users/onboarding/", "/api/v1/users/onboarding/").hasRole("GUEST")

                        .requestMatchers("/api/users/me", "/api/v1/users/me", "/api/users/me/", "/api/v1/users/me/").authenticated()
                        //    프리랜서 리뷰 등록
                        //    클라이언트가 프리랜서를 평가하는 구조이므로
                        //    CLIENT 또는 BOTH 권한이 있어야 작성 가능
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/reviews/freelancers", "/api/v1/reviews/freelancers"
                        ).hasAnyRole("CLIENT", "BOTH")


                        //    프리랜서가 클라이언트를 평가하는 구조이므로
                        //    FREELANCER 또는 BOTH 권한이 있어야 작성 가능
                        .requestMatchers(HttpMethod.POST, "/api/reviews/clients", "/api/v1/reviews/clients").hasAnyRole("FREELANCER", "BOTH")

                        // 리뷰 목록 조회는 공개하고 싶다면 GET 허용
                        //    Swagger 테스트나 상세 조회 확인할 때 편함
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**", "/api/v1/reviews/**").permitAll()

                        // 3. [권한] 프리랜서 전용 구역
                        .requestMatchers(HttpMethod.POST, "/api/portfolios", "/api/v1/portfolios", "/api/applications", "/api/v1/applications", "/api/skills", "/api/v1/skills").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers(HttpMethod.DELETE, "/api/portfolios/**", "/api/v1/portfolios/**", "/api/skills/**", "/api/v1/skills/**").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers(HttpMethod.PATCH, "/api/freelancers/status", "/api/v1/freelancers/status").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers("/api/freelancer/**", "/api/v1/freelancer/**").hasAnyRole("FREELANCER", "BOTH")

                        // [Cloudinary] 이미지 업로드: 포트폴리오 이미지는 프리랜서, 프로필 이미지는 인증된 모든 사용자
                        .requestMatchers(HttpMethod.POST, "/api/images/portfolio", "/api/images/portfolios/bulk").hasAnyRole("FREELANCER", "BOTH")
                        .requestMatchers(HttpMethod.POST, "/api/images/profile").authenticated()

                        // 4. [권한] 클라이언트 전용 구역
                        .requestMatchers(HttpMethod.POST, "/api/projects", "/api/v1/projects").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers(HttpMethod.PUT, "/api/projects/**", "/api/v1/projects/**").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers(HttpMethod.DELETE, "/api/projects/**", "/api/v1/projects/**").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers(HttpMethod.PATCH,
                                "/api/projects/*/applications", "/api/v1/projects/*/applications",
                                "/api/applications/*/accept", "/api/v1/applications/*/accept",
                                "/api/projects/*/close", "/api/v1/projects/*/close",
                                "/api/projects/*/start", "/api/v1/projects/*/start",
                                "/api/projects/*/complete", "/api/v1/projects/*/complete"
                        ).hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers("/api/client/**", "/api/v1/client/**").hasAnyRole("CLIENT", "BOTH")
                        .requestMatchers("/api/bookmarks/**", "/api/v1/bookmarks/**").hasAnyRole("CLIENT", "BOTH")

                        // 5. [나머지] 커뮤니티 글쓰기, 좋아요, 댓글 작성 등은 GUEST를 제외한 정식 유저만 가능!
                        .anyRequest().hasAnyRole("CLIENT", "FREELANCER", "BOTH")
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        // setAllowedOrigins 와 setAllowedOriginPatterns 는 상호 배타라, 패턴으로 통합한다.
        Set<String> patterns = new LinkedHashSet<>();
        patterns.add("http://localhost:*");
        patterns.add("http://127.0.0.1:*");
        patterns.add("http://192.168.*:*");
        for (String origin : allowedOrigins) {
            if (origin != null && !origin.isBlank()) {
                patterns.add(origin.trim());
            }
        }
        config.setAllowedOriginPatterns(new ArrayList<>(patterns));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
