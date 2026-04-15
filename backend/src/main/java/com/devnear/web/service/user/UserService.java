package com.devnear.web.service.user;

import com.devnear.global.auth.JwtTokenProvider;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.freelancer.FreelancerSkill;
import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.domain.user.UserRepository;
import com.devnear.web.dto.freelancer.FreelancerProfileRequest;
import com.devnear.web.dto.user.OnboardingRequest;
import com.devnear.web.dto.user.TokenResponse;
import com.devnear.web.dto.user.UserInfoResponse;
import com.devnear.web.dto.user.UserRegisterRequest;
import com.devnear.web.dto.user.UserLoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

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

    @Transactional
    public Long register(UserRegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
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

        String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole().name());
        return new TokenResponse(token, "Bearer");
    }

    /**
     * [최종 통합] 온보딩 로직: 닉네임/역할 업데이트 및 각 프로필 동시 저장
     */
    @Transactional
    public TokenResponse onboarding(String email, OnboardingRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // [보고] 리뷰 반영: NPE(NullPointerException) 방지를 위해 Objects.equals()로 안전하게 닉네임 변경 여부를 체크함
        if (!Objects.equals(user.getNickname(), request.getNickname()) &&
                userRepository.existsByNickname(request.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        // 1. 유저 기본 정보 업데이트
        user.onboard(request.getNickname(), request.getRole());

        // [보고] 500 에러 방지를 위해 필수 프로필 정보 누락 검증
        if ((request.getRole() == Role.CLIENT || request.getRole() == Role.BOTH) && request.getClientProfile() == null) {
            throw new IllegalArgumentException("클라이언트 프로필 정보가 누락되었습니다.");
        }
        if ((request.getRole() == Role.FREELANCER || request.getRole() == Role.BOTH) && request.getFreelancerProfile() == null) {
            throw new IllegalArgumentException("프리랜서 프로필 정보가 누락되었습니다.");
        }

        // 2. 클라이언트 프로필 저장 (CLIENT 또는 BOTH)
        if (request.getRole() == Role.CLIENT || request.getRole() == Role.BOTH) {
            // [보고] 리뷰 반영: 멱등성 보장 - 기존 프로필이 있으면 업데이트, 없으면 생성
            clientProfileRepository.findByUser(user)
                    .ifPresentOrElse(
                            existingProfile -> existingProfile.update(request.getClientProfile()), // 이미 있으면 Update
                            () -> clientProfileRepository.save(request.getClientProfile().toEntity(user)) // 없으면 Create
                    );
        }

        // 3. 프리랜서 프로필 저장 (FREELANCER 또는 BOTH)
        if (request.getRole() == Role.FREELANCER || request.getRole() == Role.BOTH) {
            FreelancerProfileRequest fReq = request.getFreelancerProfile();

            // [보고] 리뷰 반영: 멱등성 보장 - 기존 프리랜서 프로필이 이미 있으면 에러 처리(혹은 Update)
            if (freelancerProfileRepository.findByUser_Id(user.getId()).isPresent()) {
                throw new IllegalStateException("이미 프리랜서 프로필이 존재합니다.");
            }

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

            // 스킬 ID 리스트를 실제 FreelancerSkill 엔티티 리스트로 변환
            List<FreelancerSkill> skills = fReq.getSkillIds().stream()
                    .map(skillId -> {
                        Skill skill = skillRepository.findById(skillId)
                                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스킬 ID입니다: " + skillId));
                        return FreelancerSkill.builder()
                                .freelancerProfile(profile)
                                .skill(skill)
                                .build();
                    })
                    .collect(Collectors.toList());

            profile.updateSkills(skills);
            freelancerProfileRepository.save(profile);
        }

        // [보고] 모든 DB 저장이 성공적으로 끝나면 권한이 승격된 토큰을 새로 발급
        String newToken = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole().name());
        return new TokenResponse(newToken, "Bearer");
    }

    public UserInfoResponse getUserInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));
        return new UserInfoResponse(user);
    }

    /**
     * [Cloudinary] 프로필 이미지 URL을 DB에 반영합니다.
     * ImageController에서 Cloudinary 업로드 완료 후 호출됩니다.
     */
    @Transactional
    public void updateProfileImage(String email, String newImageUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));
        user.updateProfileImageUrl(newImageUrl);
        // @Transactional + Dirty Checking으로 별도 save() 불필요
    }
}

