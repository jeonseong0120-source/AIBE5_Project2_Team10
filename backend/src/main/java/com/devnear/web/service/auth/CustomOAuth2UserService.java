package com.devnear.web.service.auth;

import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. 구글로부터 유저 기본 정보(Attributes)를 가져옴
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 2. 현재 로그인 진행 중인 서비스 구분 (google, kakao 등)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // 3. OAuth2 로그인 진행 시 키가 되는 필드값 (구글은 기본적으로 "sub"가 PK 역할)
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        // 4. 구글이 준 유저 정보를 우리 DB에 맞게 저장하거나 업데이트함
        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes()); // 수정 가능하게 복사
        User user = saveOrUpdate(registrationId, attributes);

        // [보고] 봇 리뷰 반영: 토큰을 발급하는 SuccessHandler로 가기 전에, 유저 상태를 먼저 확인하여 입구 컷
        if (!user.isEnabled()) {
            throw new InternalAuthenticationServiceException("접근이 차단된 계정입니다. (상태: " + user.getStatus() + ")");
        }

        // [보고] 핸들러에서 꺼내 쓸 수 있게 DB PK(id)와 상태(status)를 attributes에 추가함
        attributes.put("id", user.getId());
        attributes.put("status", user.getStatus().name());

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                attributes,
                userNameAttributeName
        );
    }

    private User saveOrUpdate(String registrationId, Map<String, Object> attributes) {
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");
        String sub = (String) attributes.get("sub");

        if (email == null || sub == null) {
            throw new OAuth2AuthenticationException("필수 인증 정보(email, sub)가 누락되었습니다.");
        }

        return userRepository.findByEmail(email)
                .map(entity -> entity.update(name, picture, registrationId, sub))
                .orElseGet(() -> {
                    // [보고] 닉네임 중복 방지 및 길이 초과 방지를 위해 무작위 UUID 기반 닉네임 생성
                    String safeNickname = "user_" + UUID.randomUUID().toString().substring(0, 8);
                    
                    return userRepository.save(User.builder()
                            .email(email)
                            .name(name)
                            .nickname(safeNickname)
                            .profileImageUrl(picture)
                            // [수정] 신규 가입 유저의 기본 권한을 온보딩용 GUEST로 설정함
                            .role(Role.GUEST)
                            .provider(registrationId)
                            .providerId(sub)
                            .build());
                });
    }
}
