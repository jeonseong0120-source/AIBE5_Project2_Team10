package com.devnear.global.config;

import com.devnear.web.domain.skill.Skill;

import java.util.List;

/**
 * 앱 기본 스킬 마스터 — {@link DataInitializer}, 벌크 데모 시드 등에서 공통 사용.
 */
public final class DefaultSkillCatalog {

    private DefaultSkillCatalog() {
    }

    private record Entry(String name, String category) {
    }

    private static final List<Entry> ENTRIES = List.of(
            new Entry("Java", "Backend"),
            new Entry("Spring Boot", "Backend"),
            new Entry("React", "Frontend"),
            new Entry("Next.js", "Frontend"),
            new Entry("JavaScript", "Frontend"),
            new Entry("TypeScript", "Frontend"),
            new Entry("Node.js", "Backend"),
            new Entry("Python", "Backend"),
            new Entry("AWS", "DevOps"),
            new Entry("Docker", "DevOps"),
            new Entry("Figma", "Design"),
            new Entry("Kotlin", "Backend"),
            new Entry("Go", "Backend"),
            new Entry("PostgreSQL", "Data"),
            new Entry("MySQL", "Data"),
            new Entry("MongoDB", "Data"),
            new Entry("Redis", "Backend"),
            new Entry("Elasticsearch", "Data"),
            new Entry("GraphQL", "Backend"),
            new Entry("Vue.js", "Frontend"),
            new Entry("Angular", "Frontend"),
            new Entry("Swift", "Mobile"),
            new Entry("Flutter", "Mobile"),
            new Entry("React Native", "Mobile"),
            new Entry("Django", "Backend"),
            new Entry("FastAPI", "Backend"),
            new Entry("Express.js", "Backend"),
            new Entry("NestJS", "Backend"),
            new Entry("Kubernetes", "DevOps"),
            new Entry("Terraform", "DevOps"),
            new Entry("Jenkins", "DevOps"),
            new Entry("GitHub Actions", "DevOps"),
            new Entry("Linux", "DevOps"),
            new Entry("Nginx", "DevOps"),
            new Entry("gRPC", "Backend"),
            new Entry("Firebase", "Backend"),
            new Entry("OAuth2", "Backend"),
            new Entry("Spring Security", "Backend"),
            new Entry("JPA", "Backend"),
            new Entry("Querydsl", "Backend"),
            new Entry("MSA", "Architecture"),
            new Entry("SOLID", "Architecture"),
            new Entry("Caching", "Backend"),
            new Entry("Database Sharding", "Data"),
            new Entry("Matching Algorithm", "AI"),
            new Entry("WebSocket", "Backend"),
            new Entry("Tailwind CSS", "Frontend"),
            new Entry("Sass", "Frontend"),
            new Entry("Webpack", "Frontend"),
            new Entry("Vite", "Frontend"),
            new Entry("Jest", "QA"),
            new Entry("Cypress", "QA"),
            new Entry("Apache Kafka", "Data"),
            new Entry("RabbitMQ", "Backend"),
            new Entry("Apache Spark", "Data"),
            new Entry("Storybook", "Frontend"),
            new Entry("Solidity", "Blockchain")
    );

    /** 기본 스킬 이름 배열(시드·조회용). */
    public static final String[] NAMES = ENTRIES.stream().map(Entry::name).toArray(String[]::new);

    /** DB에 넣을 새 {@link Skill} 엔티티 목록(호출마다 새 인스턴스). */
    public static List<Skill> newSkillEntities() {
        return ENTRIES.stream()
                .map(e -> Skill.builder()
                        .name(e.name())
                        .category(e.category())
                        .isDefault(true)
                        .build())
                .toList();
    }
}
