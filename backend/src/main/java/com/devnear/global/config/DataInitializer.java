package com.devnear.global.config;

import com.devnear.web.domain.skill.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(50)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SkillRepository skillRepository;

    @Override
    public void run(String... args) throws Exception {
        // [수정] 리뷰 반영: count() == 0 체크 대신, 개별 스킬 이름을 확인하여 없는 스킬만 추가하는 방식으로 무결성 강화
        int addedCount = 0;
        for (var skill : DefaultSkillCatalog.newSkillEntities()) {
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
