package com.devnear.web.domain.freelancer;

import com.devnear.web.domain.project.Project;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.*;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.devnear.web.domain.freelancer.QFreelancerProfile.freelancerProfile;
import static com.devnear.web.domain.freelancer.QFreelancerSkill.freelancerSkill;

@RequiredArgsConstructor
public class FreelancerProfileRepositoryImpl implements FreelancerProfileRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Tuple> findOptimalFreelancersForProject(Project project, Pageable pageable) {

        // 1. 프로젝트 요구 스킬 ID 목록 추출
        Set<Long> projectSkillIds = project.getProjectSkills().stream()
                .map(ps -> ps.getSkill().getId())
                .collect(Collectors.toSet());

        // 2. 일치하는 스킬 점수 계산 (가중치 50%)
        NumberExpression<Double> skillMatchScore;
        if (projectSkillIds.isEmpty()) {
            skillMatchScore = Expressions.asNumber(0.0);
        } else {
            skillMatchScore = Expressions.asNumber(
                            JPAExpressions.select(freelancerSkill.count())
                                    .from(freelancerSkill)
                                    .where(freelancerSkill.freelancerProfile.eq(freelancerProfile)
                                            .and(freelancerSkill.skill.id.in(projectSkillIds)))
                    ).castToNum(Double.class)
                    .divide((double) projectSkillIds.size())
                    .multiply(0.5);
        }

        // 3. 평점 점수 (가중치 30%)
        NumberExpression<Double> ratingScore = freelancerProfile.averageRating.divide(5.0).multiply(0.3);

        // 4. 경험 점수 (가중치 20%)
        NumberExpression<Double> experienceRaw = Expressions.numberTemplate(Double.class,
                "LEAST(cast({0} as double), 10.0)", freelancerProfile.completedProjects);
        NumberExpression<Double> experienceScore = experienceRaw.divide(10.0).multiply(0.2);

        // 🎯 프로필 성실도 보너스
        NumberExpression<Double> profileBonus = new CaseBuilder()
                .when(freelancerProfile.introduction.isNotNull().and(freelancerProfile.introduction.ne("")))
                .then(0.005)
                .otherwise(0.0)
                .add(new CaseBuilder()
                        .when(freelancerProfile.freelancerSkills.isNotEmpty())
                        .then(0.005)
                        .otherwise(0.0));

        // 5. 총합 매칭 점수
        NumberExpression<Double> totalMatchingScore = skillMatchScore.add(ratingScore).add(experienceScore).add(profileBonus);

        // 6. 거리 계산 (ST_Distance_Sphere)
        NumberExpression<Double> distanceExpression;
        if (project.getLatitude() != null && project.getLongitude() != null && Boolean.TRUE.equals(project.isOffline())) {
            NumberExpression<Double> rawDistance = Expressions.numberTemplate(Double.class,
                    "ST_Distance_Sphere(POINT({0}, {1}), POINT({2}, {3}))",
                    freelancerProfile.longitude, freelancerProfile.latitude,
                    project.getLongitude(), project.getLatitude());

            // ✅ [Fix] 좌표가 null인 경우 0.0이 아닌 센티널 값(1e7)을 반환하여 오해 방지
            distanceExpression = new CaseBuilder()
                    .when(freelancerProfile.longitude.isNotNull().and(freelancerProfile.latitude.isNotNull()))
                    .then(rawDistance.divide(1000.0))
                    .otherwise(Expressions.asNumber(10000000.0));
        } else {
            distanceExpression = Expressions.asNumber(0.0);
        }

        // 7. 데이터 조회
        List<Tuple> content = queryFactory
                .select(freelancerProfile, totalMatchingScore, distanceExpression)
                .from(freelancerProfile)
                .where(
                        isActiveFreelancer(),
                        locationCondition(project) // ✅ 하단 필터 로직 개선됨
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(
                        new OrderSpecifier<>(com.querydsl.core.types.Order.DESC, totalMatchingScore),
                        freelancerProfile.averageRating.desc(),
                        freelancerProfile.completedProjects.desc(),
                        freelancerProfile.id.desc()
                )
                .fetch();

        // 8. 카운트 쿼리
        JPAQuery<Long> countQuery = queryFactory
                .select(freelancerProfile.count())
                .from(freelancerProfile)
                .where(isActiveFreelancer(), locationCondition(project));

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression isActiveFreelancer() {
        return freelancerProfile.isActive.isTrue();
    }

    private BooleanExpression locationCondition(Project project) {
        if (!Boolean.TRUE.equals(project.isOffline()) || project.getLatitude() == null || project.getLongitude() == null) {
            return null;
        }
        NumberExpression<Double> dist = Expressions.numberTemplate(Double.class,
                "ST_Distance_Sphere(POINT({0}, {1}), POINT({2}, {3}))",
                freelancerProfile.longitude, freelancerProfile.latitude,
                project.getLongitude(), project.getLatitude());

        // ✅ [Fix] 오프라인 검색 시 요원의 좌표가 반드시 존재해야 함 (Option B 적용)
        return dist.loe(10000.0)
                .and(freelancerProfile.latitude.isNotNull())
                .and(freelancerProfile.longitude.isNotNull());
    }
}