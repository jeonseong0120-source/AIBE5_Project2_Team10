package com.devnear.web.controller.project;

import com.devnear.web.domain.enums.ProjectStatus;
import com.devnear.web.domain.project.ProjectSearchCond;
import com.devnear.web.domain.user.User;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Project", description = "프로젝트 공고 관련 API")
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @Operation(summary = "프로젝트 공고 등록", description = "클라이언트가 새로운 프로젝트 공고를 등록합니다.")
    @PostMapping
    public ResponseEntity<Long> createProject(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.createProject(user, request));
    }

    @Operation(summary = "프로젝트 공고 수정", description = "본인이 등록한 프로젝트 공고 내용을 수정합니다.")
    @PutMapping("/{projectId}")
    public ResponseEntity<Void> updateProject(
            @AuthenticationPrincipal User user,
            @PathVariable Long projectId,
            @RequestBody @Valid ProjectRequest request) {
        projectService.updateProject(user, projectId, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "프로젝트 공고 삭제", description = "본인이 등록한 프로젝트 공고를 삭제합니다.")
    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @AuthenticationPrincipal User user,
            @PathVariable Long projectId) {
        projectService.deleteProject(user, projectId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "프로젝트 검색 및 목록 조회", description = "검색 조건(키워드, 기술 스택, 위치 등)에 맞는 프로젝트 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<Page<ProjectResponse>> getProjectList(
            ProjectSearchCond cond,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ProjectResponse> responses = projectService.searchProjects(cond, pageable);
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "내 프로젝트 목록 조회", description = "로그인한 유저가 작성한 프로젝트 공고만 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<Page<ProjectResponse>> getMyProjects(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) ProjectStatus status,  // 추가
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(projectService.getMyProjectList(user, status, pageable));
    }

    @Operation(summary = "프로젝트 공고 단건 조회", description = "프로젝트 공고 상세를 조회합니다.")
    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable Long projectId) {
        ProjectResponse response = projectService.getProject(projectId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "프로젝트 마감", description = "프로젝트 공고를 마감합니다.")
    @PatchMapping("/{projectId}/close")
    public ResponseEntity<Void> closeProject(
            @AuthenticationPrincipal User user,
            @PathVariable Long projectId) {
        projectService.closeProject(user, projectId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "프로젝트 시작", description = "프로젝트를 진행중으로 변경합니다.")
    @PatchMapping("/{projectId}/start")
    public ResponseEntity<Void> startProject(
            @AuthenticationPrincipal User user,
            @PathVariable Long projectId) {
        projectService.startProject(user, projectId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "프로젝트 완료", description = "프로젝트를 완료 처리합니다.")
    @PatchMapping("/{projectId}/complete")
    public ResponseEntity<Void> completeProject(
            @AuthenticationPrincipal User user,
            @PathVariable Long projectId) {
        projectService.completeProject(user, projectId);
        return ResponseEntity.ok().build();
    }
}