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
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
        User user = saveOrUpdate(registrationId, attributes);

        if (!user.isEnabled()) {
            throw new InternalAuthenticationServiceException("접근이 차단된 계정입니다.");
        }

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

        return userRepository.findByEmail(email)
                .map(entity -> entity.update(name, picture, registrationId, sub))
                .orElseGet(() -> {
                    // [보고] 닉네임 자동 생성 시 중복 방지 로직 추가
                    String safeNickname = generateUniqueNickname();

                    return userRepository.save(User.builder()
                            .email(email)
                            .name(name)
                            .nickname(safeNickname)
                            .profileImageUrl(picture)
                            .role(Role.GUEST)
                            .provider(registrationId)
                            .providerId(sub)
                            .build());
                });
    }

    private String generateUniqueNickname() {
        String nickname;
        do {
            nickname = "user_" + UUID.randomUUID().toString().substring(0, 8);
        } while (userRepository.existsByNickname(nickname)); // 중복이면 다시 생성
        return nickname;
    }
}