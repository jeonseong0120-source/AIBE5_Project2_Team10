package com.devnear.global.config;

import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@Order(50)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SkillRepository skillRepository;

    @Override
    @Transactional // 데이터 일관성을 위해 트랜잭션 안에서 실행하는 것이 타당
    public void run(String... args) throws Exception {
        // 1. 현재 DB에 저장된 모든 스킬 이름을 한 번에 가져와서 Set에 담음 (조회 쿼리 1번)
        Set<String> existingSkillNames = skillRepository.findAll().stream()
                .map(Skill::getName)
                .collect(Collectors.toSet());

        // 2. 카탈로그의 스킬 중 DB에 없는 '새로운 스킬'만 필터링
        List<Skill> skillsToInsert = DefaultSkillCatalog.newSkillEntities().stream()
                .filter(skill -> !existingSkillNames.contains(skill.getName()))
                .toList();

        // 3. 추가할 스킬이 있는 경우에만 벌크 인서트를 수행 (삽입 쿼리 1번 혹은 0번)
        if (!skillsToInsert.isEmpty()) {
            skillRepository.saveAll(skillsToInsert);
            log.info("========== [DataInitializer] 새로운 기본 스킬 {}개가 추가되었습니다. ==========", skillsToInsert.size());
        } else {
            log.info("========== [DataInitializer] 모든 기본 스킬이 이미 최신 상태입니다. ==========");
        }
    }
}