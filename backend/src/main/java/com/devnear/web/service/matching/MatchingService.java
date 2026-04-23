package com.devnear.web.service.matching;

import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.dto.matching.FreelancerMatchingResponse;
import com.querydsl.core.Tuple;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static com.devnear.web.domain.freelancer.QFreelancerProfile.freelancerProfile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatchingService {

    private final ProjectRepository projectRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;

    public List<FreelancerMatchingResponse> getMatchingFreelancers(Long projectId, Pageable pageable) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        Page<Tuple> matchingResults = freelancerProfileRepository.findOptimalFreelancersForProject(project, pageable);

        return matchingResults.getContent().stream()
                .map(tuple -> {
                    // ✅ [Fix] 프로필 객체 자체의 null 여부를 먼저 확인합니다.
                    FreelancerProfile profile = tuple.get(freelancerProfile);
                    if (profile == null) return null;

                    // 🎯 [유저 요청 사항] 겸업 유저(본인)는 본인이 생성한 프로젝트 추천 목록에서 제외합니다.
                    if (profile.getUser().getId().equals(project.getClientProfile().getUser().getId())) {
                        return null;
                    }

                    // 숫자는 Number.class를 통해 안전하게 형변환 (기존 로직 유지 및 강화)
                    Number scoreNum = tuple.get(1, Number.class);
                    Double score = (scoreNum != null) ? scoreNum.doubleValue() : 0.0;

                    Number distNum = tuple.get(2, Number.class);
                    Double distance = (distNum != null) ? distNum.doubleValue() : 0.0;

                    int matchingRate = (int) Math.round(score * 100);

                    // ✅ [Fix] 스킬 리스트 null 가드 적용
                    List<String> skillNames = (profile.getFreelancerSkills() == null)
                            ? List.of()
                            : profile.getFreelancerSkills().stream()
                            .filter(fs -> fs.getSkill() != null) // 스킬 객체 자체의 null 체크 추가
                            .map(fs -> fs.getSkill().getName())
                            .collect(Collectors.toList());

                    return FreelancerMatchingResponse.builder()
                            .profileId(profile.getId())
                            .nickname(profile.getUser() != null ? profile.getUser().getNickname() : "알 수 없는 요원")
                            .profileImageUrl(profile.getProfileImageUrl())
                            .introduction(profile.getIntroduction() != null ? profile.getIntroduction() : "")
                            .averageRating(profile.getAverageRating() != null ? profile.getAverageRating() : 0.0)
                            .completedProjects(profile.getCompletedProjects() != null ? profile.getCompletedProjects() : 0)
                            .skills(skillNames)
                            .isActive(Boolean.TRUE.equals(profile.getIsActive())) // Null-safe boolean 처리
                            .matchingRate(matchingRate)
                            .distance(distance)
                            .latitude(profile.getLatitude())
                            .longitude(profile.getLongitude())
                            .build();
                })
                .filter(Objects::nonNull) // ✅ 프로필이 null인 경우 결과 리스트에서 제외 (skip)
                .collect(Collectors.toList());
    }
}