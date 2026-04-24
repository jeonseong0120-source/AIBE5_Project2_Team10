package com.devnear.web.domain.project;

import com.devnear.web.domain.enums.ProjectListingKind;
import com.devnear.web.domain.enums.ProjectStatus;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static com.devnear.web.domain.project.QProject.project;
import static io.jsonwebtoken.lang.Strings.hasText;

@RequiredArgsConstructor
public class ProjectRepositoryImpl implements ProjectRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Project> search(ProjectSearchCond cond, Pageable pageable) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));

        List<Project> content = queryFactory
                .selectFrom(project)
                .leftJoin(project.clientProfile).fetchJoin()
                .where(
                        nameLike(cond.getKeyword()),
                        skillIdsIn(cond.getSkillIds()),
                        skillNamesAllMatch(cond.getSkillNames()),
                        locationContains(cond.getLocation()),
                        statusEq(cond.getStatus()),
                        isOnline(cond.getOnline()),
                        isOffline(cond.getOffline()),
                        excludeOwner(cond.getExcludeOwnerUserId()),
                        project.status.eq(ProjectStatus.OPEN), // 탐색 페이지 노출 로직 (OPEN만 노출)
                        isNotExpired(today),
                        marketplaceListingOnly()
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(project.createdAt.desc())
                .fetch();

        JPAQuery<Long> countQuery = queryFactory
                .select(project.count())
                .from(project)
                .where(
                        nameLike(cond.getKeyword()),
                        skillIdsIn(cond.getSkillIds()),
                        skillNamesAllMatch(cond.getSkillNames()),
                        locationContains(cond.getLocation()),
                        statusEq(cond.getStatus()),
                        isOnline(cond.getOnline()),
                        isOffline(cond.getOffline()),
                        excludeOwner(cond.getExcludeOwnerUserId()),
                        project.status.eq(ProjectStatus.OPEN), // 탐색 페이지 노출 로직
                        isNotExpired(today),
                        marketplaceListingOnly()
                );

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression nameLike(String keyword) {
        return hasText(keyword) ? project.projectName.containsIgnoreCase(keyword)
                .or(project.clientProfile.companyName.containsIgnoreCase(keyword)) : null;
    }

    private BooleanExpression locationContains(String location) {
        return hasText(location) ? project.location.containsIgnoreCase(location) : null;
    }

    private BooleanExpression skillIdsIn(List<Long> skillIds) {
        if (skillIds == null || skillIds.isEmpty()) return null;
        return project.projectSkills.any().skill.id.in(skillIds);
    }

    /** :dart: [수정] 모든 스택을 포함하는 프로젝트만 노출 (AND 필터 + 입력값 정규화) */
    private BooleanExpression skillNamesAllMatch(List<String> skillNames) {
        if (skillNames == null || skillNames.isEmpty()) return null;

        // 입력값 정규화: 트리밍, 빈 문자열 필터링, 대소문자 무시 중복 제거
        List<String> cleanedNames = skillNames.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .map(String::toLowerCase) // 중복 제거를 위해 일단 소문자로 변환
                .distinct()
                .collect(Collectors.toList());

        if (cleanedNames.isEmpty()) return null;

        BooleanExpression expression = null;
        for (String name : cleanedNames) {
            // 각 스킬이 존재하는지 체크하는 any()를 and로 엮으면 해당 스킬들이 모두 존재하는 프로젝트만 필터링됨
            BooleanExpression itemMatch = project.projectSkills.any().skill.name.equalsIgnoreCase(name);
            expression = (expression == null) ? itemMatch : expression.and(itemMatch);
        }
        return expression;
    }

    private BooleanExpression excludeOwner(Long excludeOwnerUserId) {
        return excludeOwnerUserId != null ? project.clientProfile.user.id.ne(excludeOwnerUserId) : null;
    }

    private BooleanExpression statusEq(ProjectStatus status) {
        return status != null ? project.status.eq(status) : null;
    }

    private BooleanExpression isOnline(Boolean online) {
        return (online != null && online) ? project.online.isTrue() : null;
    }

    private BooleanExpression isOffline(Boolean offline) {
        return (offline != null && offline) ? project.offline.isTrue() : null;
    }

    private BooleanExpression isNotExpired(LocalDate today) {
        return project.deadline.goe(today);
    }

    /** 제안서 단독 공고는 QueryDSL 검색에서 제외 (null = 레거시 마켓 공고) */
    private BooleanExpression marketplaceListingOnly() {
        return project.listingKind.isNull().or(project.listingKind.eq(ProjectListingKind.MARKETPLACE));
    }
}
