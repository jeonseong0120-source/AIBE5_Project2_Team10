package com.devnear.web.service.user;

import com.devnear.global.auth.JwtTokenProvider;
import com.devnear.global.auth.UserContext;
import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.enums.UserStatus;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.freelancer.FreelancerSkill;
import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.freelancer.FreelancerProfileRequest;
import com.devnear.web.dto.user.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final SkillRepository skillRepository;
    private final UserContext userContext;

    @Transactional
    public Long register(UserRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = request.toEntity(encodedPassword);
        return userRepository.save(user).getId();
    }

    @Transactional
    public TokenResponse login(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole().name(), user.getStatus().name());
        return new TokenResponse(token, "Bearer");
    }

    @CacheEvict(value = "users", allEntries = true)
    @Transactional
    public TokenResponse onboarding(String email, OnboardingRequest request) {
        User user = userContext.getRequiredCurrentUser();

        if (user.getStatus() == UserStatus.WITHDRAWN) throw new IllegalArgumentException("탈퇴 계정");
        if (!Objects.equals(user.getNickname(), request.getNickname()) && userRepository.existsByNickname(request.getNickname())) {
            throw new IllegalArgumentException("중복 닉네임");
        }

        user.onboard(request.getNickname(), request.getRole());

        // 🎯 1. 클라이언트 프로필 처리
        if (request.getRole() == Role.CLIENT || request.getRole() == Role.BOTH) {
            if (user.getClientProfile() != null) {
                user.getClientProfile().update(request.getClientProfile());
            } else {
                ClientProfile clientProfile = request.getClientProfile().toEntity(user);

                // 🎯 [수정] save()가 반환하는 영속(Managed) 객체를 받아서 연결
                ClientProfile savedClientProfile = clientProfileRepository.save(clientProfile);
                user.setClientProfile(savedClientProfile);
                log.info("🎯 Client Profile Linked & Saved for User: {}", user.getId());
            }
        }

        // 🎯 2. 프리랜서 프로필 처리
        if (request.getRole() == Role.FREELANCER || request.getRole() == Role.BOTH) {
            if (user.getFreelancerProfile() == null) {
                FreelancerProfileRequest fReq = request.getFreelancerProfile();
                FreelancerProfile profile = FreelancerProfile.builder()
                        .user(user)
                        .introduction(fReq.getIntroduction())
                        .location(fReq.getLocation())
                        .latitude(fReq.getLatitude())
                        .longitude(fReq.getLongitude())
                        .hourlyRate(fReq.getHourlyRate())
                        .workStyle(fReq.getWorkStyle())
                        .isActive(true)
                        .build();

                // 스킬 유효성 검증 및 N+1 문제 해결 (이전 수정본 반영)
                List<FreelancerSkill> skills = new ArrayList<>();
                List<Long> requestedSkillIds = fReq.getSkillIds();

                if (requestedSkillIds != null && !requestedSkillIds.isEmpty()) {
                    List<Skill> validSkills = skillRepository.findAllById(requestedSkillIds);

                    if (validSkills.size() != requestedSkillIds.size()) {
                        throw new IllegalArgumentException("존재하지 않는 기술 스택 ID가 포함되어 있습니다.");
                    }

                    skills = validSkills.stream()
                            .map(skill -> FreelancerSkill.builder()
                                    .freelancerProfile(profile)
                                    .skill(skill)
                                    .build())
                            .toList();
                }

                profile.updateSkills(skills);

                // 🎯 [수정] save()가 반환하는 영속(Managed) 객체를 받아서 연결합니다.
                FreelancerProfile savedFreelancerProfile = freelancerProfileRepository.save(profile);
                user.setFreelancerProfile(savedFreelancerProfile);
                log.info("🎯 Freelancer Profile Linked & Saved for User: {}", user.getId());
            }
        }

        userRepository.saveAndFlush(user);

        return new TokenResponse(
                jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole().name(), user.getStatus().name()),
                "Bearer"
        );
    }

    public UserInfoResponse getUserInfo(String email) {
        return new UserInfoResponse(userContext.getRequiredCurrentUser());
    }

    @Transactional
    public UserInfoResponse updateNotificationPreferences(String email, NotificationPreferencePatchRequest request) {
        User user = userContext.getRequiredCurrentUser();

        // 탈퇴 계정 방어막
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new IllegalArgumentException("탈퇴 계정입니다.");
        }

        if (request.getNotifyCommunityComments() != null) {
            user.setNotifyCommunityComments(request.getNotifyCommunityComments());
        }
        return new UserInfoResponse(user);
    }

    @CacheEvict(value = "users", allEntries = true)
    @Transactional
    public void updateProfileImage(String email, String newImageUrl) {
        User user = userContext.getRequiredCurrentUser();

        // 탈퇴 계정 방어막
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new IllegalArgumentException("탈퇴 계정입니다.");
        }

        user.updateProfileImageUrl(newImageUrl);
    }
}