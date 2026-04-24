package com.devnear.web.controller.project;

import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.enums.Role;
import com.devnear.web.domain.user.User;
import java.util.List;
import org.springframework.lang.Nullable;
import com.devnear.web.dto.project.ProjectRequest;
import com.devnear.web.dto.project.ProjectResponse;
import com.devnear.web.service.project.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.devnear.global.auth.LoginUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Project", description = "프로젝트 공고 관련 API")
@RestController
@RequestMapping(value = {"/api/projects", "/api/v1/projects"})
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @Operation(summary = "프로젝트 공고 등록", description = "클라이언트가 새로운 프로젝트 공고를 등록합니다.")
    @PostMapping
    public ResponseEntity<Long> createProject(
            @LoginUser User user,
            @RequestBody @Valid ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.createProject(user, request));
    }

    @Operation(summary = "프로젝트 공고 수정", description = "본인이 등록한 프로젝트 공고 내용을 수정합니다.")
    @PutMapping("/{projectId}")
    public ResponseEntity<Void> updateProject(
            @LoginUser User user,
            @PathVariable Long projectId,
            @RequestBody @Valid ProjectRequest request) {
        projectService.updateProject(user, projectId, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "프로젝트 공고 삭제", description = "본인이 등록한 프로젝트 공고를 삭제합니다.")
    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @LoginUser User user,
            @PathVariable Long projectId) {
        projectService.deleteProject(user, projectId);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "전체 프로젝트 목록 조회",
            description = "필터 및 최신순으로 프로젝트 공고를 페이징하여 조회합니다. "
                    + "본인이 클라이언트로 등록한 공고를 목록에서 빼려면 excludeOwn=true 를 주거나, "
                    + "파라미터를 생략한 채 ROLE_FREELANCER / ROLE_BOTH 이면 기본으로 본인 공고를 제외합니다. "
                    + "ROLE_CLIENT 만 있는 경우에는 생략 시 제외하지 않으며, excludeOwn=false 로 명시하면 역할과 관계없이 제외하지 않습니다."
    )
    @GetMapping
    public ResponseEntity<Page<ProjectResponse>> getProjectList(
            @Nullable @LoginUser User viewer,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false, name = "skill") List<String> skills,
            @RequestParam(required = false) Boolean online,
            @RequestParam(required = false) Boolean offline,
            @RequestParam(required = false) Boolean excludeOwn,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Long excludeOwnerUserId = resolveExcludeOwnerUserId(viewer, excludeOwn);
        Page<ProjectResponse> responses = projectService.searchProjects(
                keyword, location, skills, online, offline, excludeOwnerUserId, viewer, pageable);
        return ResponseEntity.ok(responses);
    }

    /**
     * 클라이언트 전용 계정은 기본적으로 본인 공고를 숨기지 않음.
     * {@code excludeOwn=true}이면 역할과 관계없이 본인(user)이 올린 공고 제외.
     * {@code excludeOwn=false}이면 제외하지 않음.
     * 생략 시 FREELANCER/BOTH만 본인 공고 제외(프리랜서 탐색 UX).
     */
    private static Long resolveExcludeOwnerUserId(User viewer, Boolean excludeOwn) {
        if (viewer == null) {
            return null;
        }
        if (Boolean.FALSE.equals(excludeOwn)) {
            return null;
        }
        if (Boolean.TRUE.equals(excludeOwn)) {
            return viewer.getId();
        }
        Role role = viewer.getRole();
        if (role == Role.FREELANCER || role == Role.BOTH) {
            return viewer.getId();
        }
        return null;
    }

    @Operation(summary = "내 프로젝트 목록 조회", description = "로그인한 유저가 작성한 프로젝트 공고만 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<Page<ProjectResponse>> getMyProjects(
            @LoginUser User user,
            @RequestParam(required = false) ProjectStatus status,  // 추가
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(projectService.getMyProjectList(user, status, pageable));
    }

    @Operation(summary = "특정 프리랜서의 프로젝트 목록 조회", description = "특정 프리랜서가 수행 중이거나 완료한 프로젝트를 조회합니다.")
    @GetMapping("/freelancers/{freelancerId}")
    public ResponseEntity<Page<ProjectResponse>> getFreelancerProjects(
            @PathVariable Long freelancerId,
            @RequestParam(defaultValue = "COMPLETED") ProjectStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(projectService.getFreelancerProjectList(freelancerId, status, pageable));
    }

    @Operation(summary = "프로젝트 공고 단건 조회", description = "프로젝트 공고 상세를 조회합니다.")
    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(
            @Nullable @LoginUser User viewer,
            @PathVariable Long projectId) {
        ProjectResponse response = projectService.getProject(projectId, viewer);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "프로젝트 마감", description = "프로젝트 공고를 마감합니다.")
    @PatchMapping("/{projectId}/close")
    public ResponseEntity<Void> closeProject(
            @LoginUser User user,
            @PathVariable Long projectId) {
        projectService.closeProject(user, projectId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "프로젝트 시작", description = "프로젝트를 진행중으로 변경합니다.")
    @PatchMapping("/{projectId}/start")
    public ResponseEntity<Void> startProject(
            @LoginUser User user,
            @PathVariable Long projectId) {
        projectService.startProject(user, projectId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "프로젝트 완료", description = "프로젝트를 완료 처리합니다.")
    @PatchMapping("/{projectId}/complete")
    public ResponseEntity<Void> completeProject(
            @LoginUser User user,
            @PathVariable Long projectId) {
        projectService.completeProject(user, projectId);
        return ResponseEntity.ok().build();
    }
}
