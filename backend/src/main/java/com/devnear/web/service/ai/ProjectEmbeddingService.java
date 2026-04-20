package com.devnear.web.service.ai;

import com.devnear.global.config.GeminiEmbeddingProperties;
import com.devnear.web.domain.project.Project;
import com.devnear.web.domain.project.ProjectRepository;
import com.devnear.web.domain.project.ProjectSkill;
import com.devnear.web.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/**
 * 프로젝트 공고 텍스트를 Gemini로 임베딩해 {@link Project}에 저장합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectEmbeddingService {

    private final ProjectRepository projectRepository;
    private final GeminiEmbeddingClient geminiEmbeddingClient;
    private final GeminiEmbeddingProperties geminiEmbeddingProperties;
    private final ObjectMapper objectMapper;

    @Transactional
    public void refreshEmbeddingForProjectId(Long projectId) {
        Project project = projectRepository.findByIdWithClientProfile(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("프로젝트를 찾을 수 없습니다. id=" + projectId));

        String source = buildProjectEmbeddingText(project);
        if (source.isBlank()) {
            project.clearTextEmbedding();
            return;
        }

        try {
            double[] vector = geminiEmbeddingClient.embedText(source);
            String json = objectMapper.writeValueAsString(vector);
            String model = geminiEmbeddingProperties.getEmbeddingModel();
            project.assignTextEmbedding(json, model, vector.length);
        } catch (IllegalStateException e) {
            log.warn("Skip project embedding (Gemini unavailable): projectId={} reason={}", projectId, e.getMessage());
        } catch (Exception e) {
            log.warn("Failed to persist embedding for projectId={}", projectId, e);
        }
    }

    public static String buildProjectEmbeddingText(Project project) {
        StringBuilder sb = new StringBuilder();
        sb.append("제목: ").append(nullToEmpty(project.getProjectName())).append('\n');
        sb.append("상세: ").append(nullToEmpty(project.getDetail())).append('\n');
        if (project.getProjectSkills() != null && !project.getProjectSkills().isEmpty()) {
            String skills = project.getProjectSkills().stream()
                    .map(ProjectSkill::getSkill)
                    .filter(s -> s != null && s.getName() != null)
                    .map(s -> s.getName().trim())
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(Collectors.joining(", "));
            if (!skills.isEmpty()) {
                sb.append("요구 스킬: ").append(skills).append('\n');
            }
        }
        return sb.toString().trim();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
