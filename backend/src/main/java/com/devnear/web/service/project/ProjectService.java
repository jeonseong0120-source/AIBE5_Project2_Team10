package com.devnear.web.service.project;

import com.devnear.web.domain.client.ClientProfile;
import com.devnear.web.domain.client.ClientProfileRepository;
import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.project.ProjectSkill;
import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.project.ProjectRequest;
import com.devnear.web.dto.project.ProjectResponse;
import com.devnear.web.exception.ProjectAccessDeniedException;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final SkillRepository skillRepository;

    @Transactional
    public Long createProject(User user, ProjectRequest request) {
        ClientProfile clientProfile = findClientProfileByUser(user);

        if (request.isOffline() && (request.getLocation() == null || request.getLatitude() == null)) {
            throw new IllegalArgumentException("오프라인 프로젝트는 장소 정보가 필수입니다.");
        }

        Project project = projectRepository.save(request.toEntity(clientProfile));

        if (request.getSkillNames() != null && !request.getSkillNames().isEmpty()) {
            mapSkillsToProject(project, request.getSkillNames());
        }

        if (log.isDebugEnabled()) {
            log.debug("새 프로젝트 등록 - ID: {}, 작성자: {}, 오프라인: {}, 주소: {}",
                    project.getId(), user.getEmail(), request.isOffline(), maskAddress(request.getLocation()));
        }

        return project.getId();
    }

    @Transactional
    public void updateProject(User user, Long projectId, ProjectRequest request) {
        Project project = findProjectAndValidateOwner(user, projectId);

        if (log.isDebugEnabled()) {
            log.debug("프로젝트 수정 시도 - ID: {}, 사용자: {}", projectId, user.getEmail());
        }

        project.update(request);

        if (request.getSkillNames() != null) {
            project.updateSkills(Collections.emptyList());
            if (!request.getSkillNames().isEmpty()) {
                mapSkillsToProject(project, request.getSkillNames());
            }
        }
    }

    private void mapSkillsToProject(Project project, List<String> skillNames) {
        List<ProjectSkill> projectSkills = skillNames.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .distinct()
                .map(name -> {
                    Skill skill = skillRepository.findByName(name)
                            .orElseGet(() -> skillRepository.save(Skill.builder()
                                    .name(name)
                                    .isDefault(false)
                                    .build()));
                    return ProjectSkill.builder()
                            .project(project)
                            .skill(skill)
                            .build();
                })
                .collect(Collectors.toList());

        project.updateSkills(projectSkills);
    }

    @Transactional
    public void deleteProject(User user, Long projectId) {
        Project project = findProjectAndValidateOwner(user, projectId);
        projectRepository.delete(project);

        log.info("프로젝트 삭제 완료 - ID: {}, 삭제자: {}", projectId, user.getEmail());
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> getProjectList(Pageable pageable) {
        return projectRepository.findAll(pageable)
                .map(ProjectResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> getMyProjectList(User user, ProjectStatus status, Pageable pageable) {
        ClientProfile clientProfile = findClientProfileByUser(user);

        if (status != null) {
            return projectRepository.findAllByClientProfileAndStatus(clientProfile, status, pageable)
                    .map(ProjectResponse::from);
        }
        return projectRepository.findAllByClientProfile(clientProfile, pageable)
                .map(ProjectResponse::from);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(Long projectId) {
        Project project = projectRepository.findByIdWithClientProfile(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 프로젝트 공고를 찾을 수 없습니다. ID: " + projectId));

        return ProjectResponse.from(project);
    }

    private ClientProfile findClientProfileByUser(User user) {
        return clientProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("클라이언트 프로필이 등록되지 않았습니다."));
    }

    private Project findProjectAndValidateOwner(User user, Long projectId) {
        Project project = projectRepository.findByIdWithClientProfile(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 공고를 찾을 수 없습니다."));

        if (!project.getClientProfile().getUser().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException("해당 공고에 대한 권한이 없습니다.");
        }
        return project;
    }

    private String maskAddress(String address) {
        if (address == null || address.length() < 5) return "****";
        return address.substring(0, 5) + "...(하위 주소 마스킹)";
    }

    @Transactional
    public void closeProject(User user, Long projectId) {
        Project project = findProjectAndValidateOwner(user, projectId);
        project.close();
    }

    @Transactional
    public void startProject(User user, Long projectId) {
        Project project = findProjectAndValidateOwner(user, projectId);
        project.start();
    }

    @Transactional
    public void completeProject(User user, Long projectId) {
        Project project = findProjectAndValidateOwner(user, projectId);
        project.complete();
    }
}
