package com.devnear.web.service.application;

import com.devnear.web.domain.application.ProjectApplication;
import com.devnear.web.domain.application.ProjectApplicationRepository;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.application.ApplicationRequest;
import com.devnear.web.dto.application.MyApplicationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationService {

    private final ProjectApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;

    /**
     * [FRE-04] 프리랜서가 특정 프로젝트에 지원서를 제출합니다.
     */
    @Transactional
    public Long applyToProject(User user, ApplicationRequest request) {
        // 1. 지원 자격 확인 (프리랜서 프로필 등록 여부)
        FreelancerProfile freelancer = freelancerProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("프리랜서 프로필이 등록되어 있지 않습니다."));

        // 2. 프로젝트 존재 여부 및 모집 상태 검증
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("지원하려는 프로젝트(공고)를 찾을 수 없습니다."));

        if (project.getStatus() != com.devnear.web.domain.enums.ProjectStatus.OPEN) {
            throw new IllegalStateException("현재 모집 중인 공고가 아닙니다. (지원 불가)");
        }

        // 3. 중복 지원 방지
        if (applicationRepository.existsByProjectIdAndFreelancerProfileId(project.getId(), freelancer.getId())) {
            throw new IllegalArgumentException("이미 이 공고에 지원했습니다. (ALREADY_APPLIED)");
        }

        // 4. 지원서 객체 생성 및 저장
        ProjectApplication application = ProjectApplication.builder()
                .project(project)
                .freelancerProfile(freelancer)
                .clientProfile(project.getClientProfile()) 
                .bidPrice(request.getBidPrice())
                .message(request.getMessage())
                .build();

        return applicationRepository.save(application).getId();
    }

    /**
     * [FRE-05] 프리랜서 본인이 여태 지원한 지원 내역(대시보드)을 조회합니다.
     */
    public List<MyApplicationResponse> getMyApplications(User user) {
        FreelancerProfile freelancer = freelancerProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("프리랜서 프로필이 등록되어 있지 않습니다."));

        // Repository에서 N+1 최적화된 쿼리로 꺼내서 DTO로 변환
        return applicationRepository.findByFreelancerProfileIdWithProject(freelancer.getId()).stream()
                .map(MyApplicationResponse::from)
                .collect(Collectors.toList());
    }
    // (CLI-05) 작업 영역
}
