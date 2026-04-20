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

        return matchingResults.getContent().stream().map(tuple -> {
            // 🎯 [방어] 인덱스보다 QType 객체나 Number.class를 사용하는 것이 훨씬 안전합니다.
            FreelancerProfile profile = tuple.get(freelancerProfile);

            // QueryDSL/MySQL 결과는 Double이 아닐 수 있으므로 Number로 받아서 변환합니다.
            Number scoreNum = tuple.get(1, Number.class);
            Double score = (scoreNum != null) ? scoreNum.doubleValue() : 0.0;

            Number distNum = tuple.get(2, Number.class);
            Double distance = (distNum != null) ? distNum.doubleValue() : 0.0;

            int matchingRate = (int) Math.round(score * 100);

            List<String> skillNames = profile.getFreelancerSkills().stream()
                    .map(fs -> fs.getSkill().getName())
                    .collect(Collectors.toList());

            return FreelancerMatchingResponse.builder()
                    .profileId(profile.getId())
                    .nickname(profile.getUser() != null ? profile.getUser().getNickname() : "알 수 없는 요원")
                    .profileImageUrl(profile.getProfileImageUrl())
                    .introduction(profile.getIntroduction())
                    .averageRating(profile.getAverageRating())
                    .completedProjects(profile.getCompletedProjects())
                    .skills(skillNames)
                    .isActive(profile.getIsActive())
                    .matchingRate(matchingRate)
                    .distance(distance)
                    .latitude(profile.getLatitude())
                    .longitude(profile.getLongitude())
                    .build();
        }).collect(Collectors.toList());
    }
}