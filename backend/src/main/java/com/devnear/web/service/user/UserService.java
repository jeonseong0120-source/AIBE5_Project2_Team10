package com.devnear.web.service.user;

import com.devnear.global.auth.JwtTokenProvider;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.user.OnboardingRequest;
import com.devnear.web.dto.user.TokenResponse;
import com.devnear.web.dto.user.UserInfoResponse;
import com.devnear.web.dto.user.UserRegisterRequest;
import com.devnear.web.dto.user.UserLoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public Long register(UserRegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        // 비밀번호 암호화 처리
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = request.toEntity(encodedPassword);

        return userRepository.save(user).getId();
    }

    /**
     * 로그인 로직 (최종본: JWT 토큰 발급)
     */
    @Transactional
    public TokenResponse login(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 드디어 토큰 발행!
        String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole().name());
        return new TokenResponse(token, "Bearer");
    }

    /**
     * [추가] 온보딩 로직: 닉네임과 역할을 업데이트하고 새 토큰을 발급합니다.
     */
    @Transactional
    public TokenResponse onboarding(String email, OnboardingRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // [보고] 닉네임 중복 검사 (본인의 기존 닉네임과 다를 경우만)
        if (!user.getNickname().equals(request.getNickname()) && 
            userRepository.existsByNickname(request.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        // [보고] 엔티티 업데이트 (더티 체킹으로 DB 자동 반영)
        user.onboard(request.getNickname(), request.getRole());

        // [보고] 권한이 승격(GUEST -> CLIENT 등)되었으므로 새 토큰 발급
        String newToken = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole().name());
        return new TokenResponse(newToken, "Bearer");
    }

    /**
     * [추가] 내 정보 조회
     */
    public UserInfoResponse getUserInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));
        return new UserInfoResponse(user);
    }
}
