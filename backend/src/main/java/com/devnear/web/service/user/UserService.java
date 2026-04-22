package com.devnear.web.service.user;

import com.devnear.global.auth.JwtTokenProvider;
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
import com.devnear.web.dto.user.NotificationPreferencePatchRequest;
import com.devnear.web.dto.user.OnboardingRequest;
import com.devnear.web.dto.user.TokenResponse;
import com.devnear.web.dto.user.UserInfoResponse;
import com.devnear.web.dto.user.UserLoginRequest;
import com.devnear.web.dto.user.UserRegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.dao.DataIntegrityViolationException; // 👈 예외 처리 필수 임포트
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

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

    /**
     * 회원 가입
     * [수정] 동시성 이슈 대응을 위해 try-catch 블록 추가
     */
    @Transactional
    public Long register(UserRegisterRequest request) {
        // 1차 체크 (대부분 여기서 걸러짐)
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        try {
            String encodedPassword = passwordEncoder.encode(request.getPassword());
            User user = request.toEntity(encodedPassword);

            // 2차 방어: DB Unique 제약 조건 위반 시 Catch
            // saveAndFlush를 사용하여 메서드 내부에서 즉시 예외를 발생시키고 잡을 수 있게 함
            return userRepository.save(user).getId();
        } catch (DataIntegrityViolationException e) {
            // 동시 가입 시도가 발생하여 1차 체크를 통과했더라도 DB 레이어에서 최종 차단
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }
    }

    @Transactional
    public TokenResponse login(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole().name());
        return new TokenResponse(token, "Bearer");
    }

    @CacheEvict(value = "users", key = "#email")
    @Transactional
    public TokenResponse onboarding(String email, OnboardingRequest request) {
        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new IllegalArgumentException("탈퇴 처리된 계정입니다.");
        }

        if (!Objects.equals(user.getNickname(), request.getNickname()) &&
                userRepository.existsByNickname(request.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        user.onboard(request.getNickname(), request.getRole());

        // 클라이언트 프로필 처리
        if (request.getRole() == Role.CLIENT || request.getRole() == Role.BOTH) {
            if (user.getClientProfile() != null) {
                user.getClientProfile().update(request.getClientProfile());
            } else {
                clientProfileRepository.save(request.getClientProfile().toEntity(user));
            }
        }

        // 프리랜서 프로필 처리
        if (request.getRole() == Role.FREELANCER || request.getRole() == Role.BOTH) {
            if (user.getFreelancerProfile() != null) {
                throw new IllegalStateException("이미 프리랜서 프로필이 존재합니다.");
            }

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

            List<FreelancerSkill> skills = fReq.getSkillIds().stream()
                    .map(skillId -> {
                        Skill skill = skillRepository.findById(skillId)
                                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스킬 ID입니다: " + skillId));
                        return FreelancerSkill.builder()
                                .freelancerProfile(profile)
                                .skill(skill)
                                .build();
                    })
                    .toList();

            profile.updateSkills(skills);
            freelancerProfileRepository.save(profile);
        }

        String newToken = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole().name());
        return new TokenResponse(newToken, "Bearer");
    }

    public UserInfoResponse getUserInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));
        return new UserInfoResponse(user);
    }

    @Transactional
    public UserInfoResponse updateNotificationPreferences(String email, NotificationPreferencePatchRequest request) {
        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new IllegalArgumentException("탈퇴 처리된 계정입니다.");
        }
        if (request.getNotifyCommunityComments() != null) {
            user.setNotifyCommunityComments(request.getNotifyCommunityComments());
        }
        return new UserInfoResponse(user);
    }

    /**
     * [Cloudinary] 프로필 이미지 URL을 DB에 반영합니다.
     * ImageController에서 Cloudinary 업로드 완료 후 호출됩니다.
     */
    @CacheEvict(value = "users", key = "#email")
    @Transactional
    public void updateProfileImage(String email, String newImageUrl) {
        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new IllegalArgumentException("탈퇴 처리된 계정입니다.");
        }
        user.updateProfileImageUrl(newImageUrl);
    }
}