package com.devnear.web.service.freelancer;

import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.freelancer.FreelancerSkill;
import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.freelancer.FreelancerProfileRequest;
import com.devnear.web.dto.freelancer.FreelancerProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FreelancerService {

    private final FreelancerProfileRepository profileRepository;
    private final SkillRepository skillRepository;

    // [조회] 내 프로필 상세 데이터 조회
    public FreelancerProfileResponse getMyProfile(User user) {
        // N+1 문제 방지를 위해 Fetch Join 쿼리로 보유 스킬 일괄 로드
        FreelancerProfile profile = profileRepository.findByUserIdWithSkills(user.getId())
                .orElse(null);

        if (profile == null) {
            return null;
        }
        return FreelancerProfileResponse.from(profile);
    }

    // [수정] 내 프로필 등록 및 정보 일괄 업데이트
    @Transactional
    public FreelancerProfileResponse updateMyProfile(User user, FreelancerProfileRequest request) {
        // 1. 기존 프로필 조회 (존재하지 않으면 신규 껍데기 생성)
        FreelancerProfile profile = profileRepository.findByUser_Id(user.getId())
                .orElseGet(() -> FreelancerProfile.builder()
                        .user(user)
                        .isActive(true)
                        .build());

        // 2. 기본 텍스트 및 속성 정보 덮어쓰기
        profile.updateProfile(
                request.getProfileImageUrl(),
                request.getIntroduction(),
                request.getLocation(),
                request.getLatitude(),
                request.getLongitude(),
                request.getHourlyRate(),
                request.getWorkStyle(),
                request.getIsActive());

        // 3. 스킬 목록 갱신
        if (request.getSkillIds() != null) {
            // 선택된 스킬 엔티티 일괄 조회
            List<Skill> selectedSkills = skillRepository.findAllById(request.getSkillIds());
            
            // 보유 스킬 ID 검증 (존재하지 않는 ID 방어)
            if (selectedSkills.size() != request.getSkillIds().size()) {
                List<Long> foundIds = selectedSkills.stream().map(Skill::getId).collect(Collectors.toList());
                List<Long> missingIds = request.getSkillIds().stream()
                        .filter(id -> !foundIds.contains(id))
                        .collect(Collectors.toList());
                throw new IllegalArgumentException("존재하지 않는 스킬 ID가 포함되어 있습니다: " + missingIds);
            }

            // 연결 엔티티(Bridge) 객체로 매핑
            List<FreelancerSkill> newFreelancerSkills = selectedSkills.stream()
                    .map(skill -> FreelancerSkill.builder()
                            .freelancerProfile(profile)
                            .skill(skill)
                            .build())
                    .collect(Collectors.toList());

            // 컬렉션 교체 (JPA orphanRemoval 자동 동작)
            profile.updateSkills(newFreelancerSkills);
        }

        return FreelancerProfileResponse.from(profileRepository.save(profile));
    }

    // [탐색] 조건에 맞는 프리랜서 목록 검색
    public List<FreelancerProfileResponse> searchFreelancers(String skill, String region, String sort) {
        // 지역 및 스킬 조건 필터링
        List<FreelancerProfile> profiles = profileRepository.searchFreelancers(skill, region);

        // [수정] 500 에러 방지: 정렬 필드(rating, projects)가 null일 경우를 대비하여 안전한 비교 로직으로 수정
        Comparator<FreelancerProfile> comparator;
        if ("rating".equalsIgnoreCase(sort)) {
            comparator = Comparator.comparing(FreelancerProfile::getAverageRating, Comparator.nullsLast(Comparator.reverseOrder()));
        } else if ("projects".equalsIgnoreCase(sort)) {
            comparator = Comparator.comparing(FreelancerProfile::getCompletedProjects, Comparator.nullsLast(Comparator.reverseOrder()));
        } else {
            comparator = Comparator.comparing(FreelancerProfile::getId, Comparator.reverseOrder());
        }
        profiles.sort(comparator);

        return profiles.stream()
                .map(FreelancerProfileResponse::from)
                .collect(Collectors.toList());
    }

    // [조회] 타인 프로필 상세 조회
    public FreelancerProfileResponse getFreelancerById(Long id) {
        FreelancerProfile profile = profileRepository.findByIdWithSkills(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프리랜서입니다."));
        return FreelancerProfileResponse.from(profile);
    }

    // [수정] 내 활동 상태(토글) 단독 업데이트
    @Transactional
    public void updateStatus(User user, Boolean isActive) {
        if (isActive == null) {
            throw new IllegalArgumentException("활동 상태값(isActive)은 필수입니다.");
        }
        
        FreelancerProfile profile = profileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("프로필이 아직 생성되지 않았습니다."));

        // 다른 정보는 유지하고 상태값만 덮어쓰기
        profile.updateProfile(
                profile.getProfileImageUrl(),
                profile.getIntroduction(),
                profile.getLocation(),
                profile.getLatitude(),
                profile.getLongitude(),
                profile.getHourlyRate(),
                profile.getWorkStyle(),
                isActive);
    }

    // [삭제] 내 프리랜서 프로필 삭제
    @Transactional
    public void deleteMyProfile(User user) {
        FreelancerProfile profile = profileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("프로필이 존재하지 않습니다."));
        profileRepository.delete(profile);
    }
}
