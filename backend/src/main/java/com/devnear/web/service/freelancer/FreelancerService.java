package com.devnear.web.service.freelancer;

import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.freelancer.FreelancerSkill;
import com.devnear.web.domain.portfolio.PortfolioRepository;
import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.freelancer.FreelancerProfileRequest;
import com.devnear.web.dto.freelancer.FreelancerProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FreelancerService {

    private static final int MAX_PORTFOLIO_PREVIEW_IMAGES = 10;

    private final FreelancerProfileRepository profileRepository;
    private final SkillRepository skillRepository;
    private final PortfolioRepository portfolioRepository;

    public FreelancerProfileResponse getMyProfile(User user) {
        FreelancerProfile profile = profileRepository.findByUserIdWithSkills(user.getId())
                .orElse(null);

        if (profile == null) {
            return null;
        }
        return FreelancerProfileResponse.from(profile);
    }

    @Transactional
    public FreelancerProfileResponse updateMyProfile(User user, FreelancerProfileRequest request) {
        FreelancerProfile profile = profileRepository.findByUserIdWithSkills(user.getId())
                .orElseGet(() -> FreelancerProfile.builder()
                        .user(user)
                        .isActive(true)
                        .build());

        profile.updateProfile(
                request.getProfileImageUrl(),
                request.getIntroduction(),
                request.getLocation(),
                request.getLatitude(),
                request.getLongitude(),
                request.getHourlyRate(),
                request.getWorkStyle(),
                request.getIsActive());

        if (request.getSkillIds() != null) {
            List<Skill> selectedSkills = skillRepository.findAllById(request.getSkillIds());
            
            if (selectedSkills.size() != request.getSkillIds().size()) {
                List<Long> foundIds = selectedSkills.stream().map(Skill::getId).collect(Collectors.toList());
                List<Long> missingIds = request.getSkillIds().stream()
                        .filter(id -> !foundIds.contains(id))
                        .collect(Collectors.toList());
                throw new IllegalArgumentException("존재하지 않는 스킬 ID가 포함되어 있습니다: " + missingIds);
            }

            List<FreelancerSkill> newFreelancerSkills = selectedSkills.stream()
                    .map(skill -> FreelancerSkill.builder()
                            .freelancerProfile(profile)
                            .skill(skill)
                            .build())
                    .collect(Collectors.toList());

            profile.updateSkills(null);
            profileRepository.saveAndFlush(profile);

            profile.updateSkills(newFreelancerSkills);
            FreelancerProfile saved = profileRepository.saveAndFlush(profile);
            return FreelancerProfileResponse.from(saved);
        }

        FreelancerProfile saved = profileRepository.save(profile);
        return FreelancerProfileResponse.from(saved);
    }

    public List<FreelancerProfileResponse> searchFreelancers(List<String> skills,
                                                             String region,
                                                             String sort,
                                                             String workStyle,
                                                             String keyword,
                                                             Integer minHourlyRate,
                                                             Integer maxHourlyRate,
                                                             Long excludeUserId) {
        com.devnear.web.domain.enums.WorkStyle workStyleEnum = null;
        if (workStyle != null && !workStyle.isEmpty()) {
            try {
                workStyleEnum = com.devnear.web.domain.enums.WorkStyle.valueOf(workStyle.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        List<FreelancerProfile> profiles = profileRepository.searchFreelancers(
                skills, region, workStyleEnum, keyword, minHourlyRate, maxHourlyRate, excludeUserId);

        // 🎯 [개선] 정렬 파라미터 파싱 및 동적 정렬 구현 ( Perfect Sort )
        String sortField = "id";
        String sortDir = "desc";

        if (sort != null && !sort.isEmpty()) {
            String[] parts = sort.split(",");
            sortField = parts[0];
            if (parts.length > 1) {
                sortDir = parts[1];
            }
        }

        final boolean isAsc = "asc".equalsIgnoreCase(sortDir);
        Comparator<FreelancerProfile> comparator;

        if ("rating".equalsIgnoreCase(sortField) || "averagerating".equalsIgnoreCase(sortField)) {
            Comparator<Double> ratingComp = isAsc ? Comparator.naturalOrder() : Comparator.reverseOrder();
            comparator = Comparator.comparing(FreelancerProfile::getAverageRating, Comparator.nullsLast(ratingComp));
        } else if ("grade".equalsIgnoreCase(sortField) || "grade.id".equalsIgnoreCase(sortField)) {
            // 등급 정렬: ID가 낮을수록(1: TOP) 높은 등급
            // desc(기본)일 때 높은 등급(ID 1)이 먼저 오게 하려면 naturalOrder() 사용
            Comparator<Long> gradeComp = isAsc ? Comparator.reverseOrder() : Comparator.naturalOrder();
            comparator = Comparator.comparing(p -> p.getGrade() != null ? p.getGrade().getId() : Long.MAX_VALUE, gradeComp);
        } else if ("hourlyrate".equalsIgnoreCase(sortField) || "rate".equalsIgnoreCase(sortField)) {
            Comparator<Integer> rateComp = isAsc ? Comparator.naturalOrder() : Comparator.reverseOrder();
            comparator = Comparator.comparing(FreelancerProfile::getHourlyRate, Comparator.nullsLast(rateComp));
        } else {
            // 기본 정렬: 등록일(ID) 기준
            comparator = isAsc ? Comparator.comparing(FreelancerProfile::getId) : Comparator.comparing(FreelancerProfile::getId).reversed();
        }

        profiles.sort(comparator);

        List<Long> userIds = profiles.stream()
                .map(p -> p.getUser().getId())
                .distinct()
                .collect(Collectors.toList());
        Map<Long, List<String>> portfolioUrlsByUserId = loadPortfolioPreviewUrlsByUserId(userIds);

        return profiles.stream()
                .map(p -> FreelancerProfileResponse.from(
                        p,
                        portfolioUrlsByUserId.getOrDefault(p.getUser().getId(), List.of())))
                .collect(Collectors.toList());
    }

    private Map<Long, List<String>> loadPortfolioPreviewUrlsByUserId(Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        List<PortfolioRepository.PortfolioPreviewRow> rows = portfolioRepository.findPreviewRowsByUserIds(userIds);

        Map<Long, List<String>> result = new HashMap<>();
        Map<Long, Set<String>> seenByUser = new HashMap<>();

        for (PortfolioRepository.PortfolioPreviewRow row : rows) {
            Long userId = row.getUserId();
            String url = row.getPreviewUrl();
            if (userId == null || url == null || url.isBlank()) {
                continue;
            }

            List<String> urls = result.computeIfAbsent(userId, k -> new java.util.ArrayList<>());
            if (urls.size() >= MAX_PORTFOLIO_PREVIEW_IMAGES) {
                continue;
            }

            Set<String> seen = seenByUser.computeIfAbsent(userId, k -> new HashSet<>());
            if (seen.add(url)) {
                urls.add(url);
            }
        }

        return result;
    }

    public FreelancerProfileResponse getFreelancerById(Long id) {
        FreelancerProfile profile = profileRepository.findByIdWithSkills(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프리랜서입니다."));
        return FreelancerProfileResponse.from(profile);
    }

    @Transactional
    public void updateStatus(User user, Boolean isActive) {
        if (isActive == null) {
            throw new IllegalArgumentException("활동 상태값(isActive)은 필수입니다.");
        }
        
        FreelancerProfile profile = profileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("프로필이 아직 생성되지 않았습니다."));

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

    @Transactional
    public void deleteMyProfile(User user) {
        FreelancerProfile profile = profileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("프로필이 존재하지 않습니다."));
        profileRepository.delete(profile);
    }
}
