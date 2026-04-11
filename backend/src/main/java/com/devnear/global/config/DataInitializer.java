package com.devnear.global.config;

import com.devnear.web.domain.skill.Skill;
import com.devnear.web.domain.skill.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SkillRepository skillRepository;

    @Override
    public void run(String... args) throws Exception {
        // [수정] 리뷰 반영: count() == 0 체크 대신, 개별 스킬 이름을 확인하여 없는 스킬만 추가하는 방식으로 무결성 강화
        List<Skill> defaultSkills = List.of(
                Skill.builder().name("Java").isDefault(true).category("Backend").build(),
                Skill.builder().name("Spring Boot").isDefault(true).category("Backend").build(),
                Skill.builder().name("React").isDefault(true).category("Frontend").build(),
                Skill.builder().name("Next.js").isDefault(true).category("Frontend").build(),
                Skill.builder().name("TypeScript").isDefault(true).category("Frontend").build(),
                Skill.builder().name("Node.js").isDefault(true).category("Backend").build(),
                Skill.builder().name("Figma").isDefault(true).category("Design").build(),
                Skill.builder().name("Python").isDefault(true).category("Backend").build(),
                Skill.builder().name("AWS").isDefault(true).category("DevOps").build(),
                Skill.builder().name("Docker").isDefault(true).category("DevOps").build()
        );

        int addedCount = 0;
        for (Skill skill : defaultSkills) {
            if (!skillRepository.existsByName(skill.getName())) {
                skillRepository.save(skill);
                addedCount++;
            }
        }

        if (addedCount > 0) {
            System.out.println("========== [DataInitializer] 기본 스킬 " + addedCount + "개가 새롭게 추가되었습니다! ==========");
        }
    }
}
