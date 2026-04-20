package com.devnear.web.domain.freelancer;

import com.devnear.web.domain.project.Project;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.*;
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
            NumberExpression<Double> skillCountSubQuery = Expressions.numberTemplate(Double.class,
                    "(SELECT cast(count(fs.id) as double) FROM FreelancerSkill fs WHERE fs.freelancerProfile = {0} AND fs.skill.id IN ({1}))",
                    freelancerProfile, projectSkillIds);
            skillMatchScore = skillCountSubQuery.divide((double) projectSkillIds.size()).multiply(0.5);
        }

        // 3. 평점 점수 (가중치 30%)
        NumberExpression<Double> ratingScore = freelancerProfile.averageRating.divide(5.0).multiply(0.3);

        // 4. 경험 점수 (가중치 20%)
        NumberExpression<Double> experienceRaw = Expressions.numberTemplate(Double.class,
                "LEAST(cast({0} as double), 10.0)", freelancerProfile.completedProjects);
        NumberExpression<Double> experienceScore = experienceRaw.divide(10.0).multiply(0.2);

        // 🎯 [지능형 추가] 프로필 성실도 보너스
        // 스킬이 하나라도 있거나, 자기소개가 있으면 미세한 점수(0.01)를 부여해 유령 계정(0점)을 이기게 합니다.
        NumberExpression<Double> profileBonus = new CaseBuilder()
                .when(freelancerProfile.introduction.isNotNull().and(freelancerProfile.introduction.ne("")))
                .then(0.005)
                .otherwise(0.0)
                .add(new CaseBuilder()
                        .when(freelancerProfile.freelancerSkills.isNotEmpty())
                        .then(0.005)
                        .otherwise(0.0));

        // 5. 총합 매칭 점수 (보너스 포함)
        NumberExpression<Double> totalMatchingScore = skillMatchScore.add(ratingScore).add(experienceScore).add(profileBonus);

        // 6. 거리 계산 (ST_Distance_Sphere)
        NumberExpression<Double> distanceExpression;
        if (project.getLatitude() != null && project.getLongitude() != null && Boolean.TRUE.equals(project.isOffline())) {
            NumberExpression<Double> rawDistance = Expressions.numberTemplate(Double.class,
                    "ST_Distance_Sphere(POINT({0}, {1}), POINT({2}, {3}))",
                    freelancerProfile.longitude, freelancerProfile.latitude,
                    project.getLongitude(), project.getLatitude());

            distanceExpression = new CaseBuilder()
                    .when(freelancerProfile.longitude.isNotNull().and(freelancerProfile.latitude.isNotNull()))
                    .then(rawDistance.divide(1000.0))
                    .otherwise(Expressions.asNumber(0.0));
        } else {
            distanceExpression = Expressions.asNumber(0.0);
        }

        // 7. 데이터 조회
        List<Tuple> content = queryFactory
                .select(freelancerProfile, totalMatchingScore, distanceExpression)
                .from(freelancerProfile)
                .where(
                        isActiveFreelancer(),
                        locationCondition(project)
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(
                        // 🎯 [정렬 조건 강화] 동점자 발생 시 처리 순서
                        new OrderSpecifier<>(com.querydsl.core.types.Order.DESC, totalMatchingScore), // 1. 매칭률+성실도
                        freelancerProfile.averageRating.desc(), // 2. 평점
                        freelancerProfile.completedProjects.desc(), // 3. 경험(프로젝트 수)
                        freelancerProfile.id.desc() // 4. 최신 가입자 (안정적 정렬 보장)
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
        return dist.loe(10000.0);
    }
}