package com.devnear.global.seed;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * {@link DemoBulkSeedService}를 앱 기동 시 한 번 실행합니다.
 * <p>
 * {@code app.seed.bulk-demo=true} 일 때만 빈이 등록됩니다.
 * {@link com.devnear.global.config.DataInitializer} 기본 스킬 이후에 실행되도록 Order를 둡니다.
 */
@Component
@Order(200)
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.seed", name = "bulk-demo", havingValue = "true")
public class DemoBulkSeedRunner implements CommandLineRunner {

    private final DemoBulkSeedService demoBulkSeedService;

    @Override
    public void run(String... args) {
        try {
            demoBulkSeedService.seedIfNeeded();
        } catch (Exception e) {
            log.error("[DemoBulkSeed] 시드 실행 실패 (앱은 계속 기동)", e);
        }
    }
}
