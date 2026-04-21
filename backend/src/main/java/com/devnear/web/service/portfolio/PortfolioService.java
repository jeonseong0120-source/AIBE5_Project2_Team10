package com.devnear.web.service.portfolio;

import com.devnear.web.domain.portfolio.Portfolio;
import com.devnear.web.domain.portfolio.PortfolioImage;
import com.devnear.web.domain.portfolio.PortfolioRepository;
import com.devnear.web.domain.portfolio.PortfolioSkill;
import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import com.devnear.web.domain.user.User;
import com.devnear.web.dto.portfolio.PortfolioRequest;
import com.devnear.web.dto.portfolio.PortfolioResponse;
import com.devnear.web.exception.ProjectAccessDeniedException;
import com.devnear.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.devnear.web.domain.freelancer.FreelancerProfile;
import com.devnear.web.domain.freelancer.FreelancerProfileRepository;
import com.devnear.web.domain.freelancer.FreelancerSkill;
import com.devnear.web.service.freelancer.FreelancerGradeService;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioService {

    /** {@link com.devnear.web.dto.freelancer.FreelancerProfileRequest} 스킬 상한과 동일 */
    private static final int MAX_FREELANCER_PROFILE_SKILLS = 50;

    private static final Logger log = LoggerFactory.getLogger(PortfolioService.class);
    private final PortfolioRepository portfolioRepository;
    private final SkillRepository skillRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final FreelancerGradeService freelancerGradeService;

    // [등록] POST /api/portfolios
    @Transactional
    public Long createPortfolio(User user, PortfolioRequest request) {
        // 1. 포트폴리오 엔티티 생성
        Portfolio portfolio = Portfolio.builder()
                .user(user)
                .title(request.getTitle())
                .desc(request.getDesc())
                .thumbnailUrl(request.getThumbnailUrl())
                .build();

        // 2-1. 다중 이미지 연결 (Cascade 처리, 정렬 순서 보장)
        int order = 0;
        for (String imageUrl : request.getPortfolioImages()) {
            PortfolioImage imageEntity = PortfolioImage.builder()
                    .portfolio(portfolio)
                    .imageUrl(imageUrl)
                    .sortOrder(order++)
                    .build();
            portfolio.addPortfolioImage(imageEntity);
        }

        // 2-2. 요청받은 스킬 존재 여부 꼼꼼하게 검증 (유령 스킬 차단 방어 로직)
        List<Long> uniqueSkillIds = request.getSkills().stream().distinct().collect(Collectors.toList());
        List<Skill> selectedSkills = skillRepository.findAllById(uniqueSkillIds);
        if (selectedSkills.size() != uniqueSkillIds.size()) {
            List<Long> foundIds = selectedSkills.stream().map(Skill::getId).collect(Collectors.toList());
            List<Long> missingIds = uniqueSkillIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .collect(Collectors.toList());
            throw new IllegalArgumentException("존재하지 않는 스킬 ID가 포함되어 있습니다: " + missingIds);
        }

        // 3. 브릿지 객체로 스킬 연결
        for (Skill skill : selectedSkills) {
            PortfolioSkill portfolioSkill = PortfolioSkill.builder()
                    .portfolio(portfolio)
                    .skill(skill)
                    .build();
            portfolio.addPortfolioSkill(portfolioSkill);
        }

        // 4. 저장 후 생성된 ID 반환
        Long savedId = portfolioRepository.save(portfolio).getId();

        mergePortfolioSkillsIntoFreelancerProfile(user.getId());

        // 등급 재계산 (백그라운드 최선 시도 후 포트폴리오 작업에 영향없음)
        try {
            freelancerProfileRepository.findByUser_Id(user.getId())
                    .ifPresent(freelancerGradeService::refreshGrade);
        } catch (Exception e) {
            log.warn("[PortfolioService] 등급 재계산 실패 (userId={}) - 포트폴리오 등록은 정상 완료: {}", user.getId(), e.getMessage());
        }

        return savedId;
    }

    // [조회] GET /api/portfolios (특정 유저의 목록 반환)
    public List<PortfolioResponse> getPortfoliosByUserId(Long userId) {
        List<Portfolio> portfolios = portfolioRepository.findByUserIdWithSkills(userId);
        
        return portfolios.stream()
                .map(PortfolioResponse::from)
                .collect(Collectors.toList());
    }

    // [삭제] DELETE /api/portfolios/{id}
    @Transactional
    public void deletePortfolio(User user, Long portfolioId) {
        // 1. 엔티티 우선 조회 및 404 방어
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("삭제하려는 포트폴리오를 찾을 수 없습니다. (NOT_FOUND)"));

        // 2. 남의 포트폴리오를 삭제하려고 하는지 권한 검증 (보안)
        if (!portfolio.getUser().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException("본인의 포트폴리오만 삭제할 수 있습니다. (FORBIDDEN)");
        }

        // 3. 권한 문제없으면 삭제 실행 (Cascade 속성으로 인해 딸려있던 기술스택 데이터도 알아서 날아감)
        portfolioRepository.delete(portfolio);

        mergePortfolioSkillsIntoFreelancerProfile(user.getId());

        // 등급 재계산 (백그라운드 최선 시도 후 포트폴리오 작업에 영향없음)
        try {
            freelancerProfileRepository.findByUser_Id(user.getId())
                    .ifPresent(freelancerGradeService::refreshGrade);
        } catch (Exception e) {
            log.warn("[PortfolioService] 등급 재계산 실패 (userId={}) - 포트폴리오 삭제는 정상 완료: {}", user.getId(), e.getMessage());
        }
    }

    // [수정] PUT /api/portfolios/{id}
    @Transactional
    public void updatePortfolio(User user, Long portfolioId, PortfolioRequest request) {
        // 1. 엔티티 우선 조회 및 404 방어
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("수정하려는 포트폴리오를 찾을 수 없습니다."));

        // 2. 권한 검증 (보안)
        if (!portfolio.getUser().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException("본인의 포트폴리오만 수정할 수 있습니다.");
        }

        // 3. 포트폴리오 기본 정보 업데이트
        portfolio.update(request.getTitle(), request.getDesc(), request.getThumbnailUrl());

        // 4. 기존 관련 데이터 비우기 (orphanRemoval = true) 및 삭제 즉시 쿼리 발생 (flush)
        portfolio.getPortfolioImages().clear();
        portfolio.getPortfolioSkills().clear();
        portfolioRepository.flush(); // 기존 스킬 데이터 선 삭제 보장 (Unique 제약조건 충돌 방지)

        // 5. 다중 이미지 재연결 (순서 보장)
        int order = 0;
        for (String imageUrl : request.getPortfolioImages()) {
            portfolio.addPortfolioImage(PortfolioImage.builder()
                    .portfolio(portfolio)
                    .imageUrl(imageUrl)
                    .sortOrder(order++)
                    .build());
        }

        // 6. 스킬 존재 여부 재검증 및 재연결
        List<Long> uniqueSkillIds = request.getSkills().stream().distinct().collect(Collectors.toList());
        List<Skill> selectedSkills = skillRepository.findAllById(uniqueSkillIds);
        if (selectedSkills.size() != uniqueSkillIds.size()) {
            List<Long> foundIds = selectedSkills.stream().map(Skill::getId).collect(Collectors.toList());
            List<Long> missingIds = uniqueSkillIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .collect(Collectors.toList());
            throw new IllegalArgumentException("존재하지 않는 스킬 ID가 포함되어 있습니다: " + missingIds);
        }

        for (Skill skill : selectedSkills) {
            portfolio.addPortfolioSkill(PortfolioSkill.builder()
                    .portfolio(portfolio)
                    .skill(skill)
                    .build());
        }

        portfolioRepository.flush();
        mergePortfolioSkillsIntoFreelancerProfile(user.getId());

        // 7. 등급 재계산 (백그라운드 최선 시도 후 포트폴리오 작업에 영향없음)
        try {
            freelancerProfileRepository.findByUser_Id(user.getId())
                    .ifPresent(freelancerGradeService::refreshGrade);
        } catch (Exception e) {
            log.warn("[PortfolioService] 등급 재계산 실패 (userId={}) - 포s트폴리오 수정은 정상 완료: {}", user.getId(), e.getMessage());
        }
    }

    /**
     * 내 포트폴리오들에 붙은 스킬을 합친 뒤, 아직 없는 기존 프로필 스킬을 뒤에 붙여 최대 {@value #MAX_FREELANCER_PROFILE_SKILLS}개로 맞춥니다.
     * 프리랜서 프로필이 없으면 아무 것도 하지 않습니다.
     */
    private void mergePortfolioSkillsIntoFreelancerProfile(Long userId) {
        Optional<FreelancerProfile> profileOpt = freelancerProfileRepository.findByUserIdWithSkills(userId);
        if (profileOpt.isEmpty()) {
            return;
        }
        FreelancerProfile profile = profileOpt.get();
        List<Portfolio> portfolios = portfolioRepository.findByUserIdWithSkills(userId);
        portfolios.sort(Comparator.comparing(Portfolio::getId));
        LinkedHashMap<Long, Skill> merged = new LinkedHashMap<>();
        for (Portfolio p : portfolios) {
            for (PortfolioSkill ps : p.getPortfolioSkills()) {
                if (merged.size() >= MAX_FREELANCER_PROFILE_SKILLS) {
                    break;
                }
                Skill s = ps.getSkill();
                merged.putIfAbsent(s.getId(), s);
            }
            if (merged.size() >= MAX_FREELANCER_PROFILE_SKILLS) {
                break;
            }
        }
        List<FreelancerSkill> links = merged.values().stream()
                .map(skill -> FreelancerSkill.builder()
                        .freelancerProfile(profile)
                        .skill(skill)
                        .build())
                .collect(Collectors.toList());
        // unique(freelancer_profile_id, skill_id) 충돌 방지:
        // 기존 행 DELETE를 먼저 flush한 뒤 새 행 INSERT를 반영한다.
        profile.updateSkills(null);
        freelancerProfileRepository.saveAndFlush(profile);
        profile.updateSkills(links);
        freelancerProfileRepository.saveAndFlush(profile);
    }
}
