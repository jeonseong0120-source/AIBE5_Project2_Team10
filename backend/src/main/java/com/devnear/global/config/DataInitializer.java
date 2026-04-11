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
        // [추가] 서버 시작 시 스킬 테이블이 비어 있다면 기본 스킬을 자동으로 채워줌
        // 프론트엔드 온보딩 테스트에서 '존재하지 않는 스킬' 에러를 막기 위한 조치
        if (skillRepository.count() == 0) {
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
            skillRepository.saveAll(defaultSkills);
            System.out.println("========== [DataInitializer] 기본 스킬 10개가 성공적으로 생성되었습니다! ==========");
        }
    }
}
