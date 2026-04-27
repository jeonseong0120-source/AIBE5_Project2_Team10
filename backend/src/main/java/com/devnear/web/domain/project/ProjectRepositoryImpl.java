package com.devnear.web.domain.project;

import com.devnear.web.domain.enums.ProjectListingKind;
import com.devnear.web.domain.enums.ProjectStatus;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.support.PageableExecutionUtils;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
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
                .leftJoin(project.clientProfile.user).fetchJoin()
                .where(
                        nameLike(cond.getKeyword()),
                        skillIdsIn(cond.getSkillIds()),
                        skillNamesAllMatch(cond.getSkillNames()),
                        locationContains(cond.getLocation()),
                        statusEq(cond.getStatus()),
                        isOnline(cond.getOnline()),
                        isOffline(cond.getOffline()),
                        budgetGoe(cond.getMinBudget()),
                        budgetLoe(cond.getMaxBudget()),
                        excludeOwner(cond.getExcludeOwnerUserId()),
                        project.status.eq(ProjectStatus.OPEN),
                        isNotExpired(today),
                        marketplaceListingOnly()
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(getOrderSpecifiers(pageable.getSort())) // 🎯 [개선] 동적 정렬 적용
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
                        budgetGoe(cond.getMinBudget()),
                        budgetLoe(cond.getMaxBudget()),
                        excludeOwner(cond.getExcludeOwnerUserId()),
                        project.status.eq(ProjectStatus.OPEN),
                        isNotExpired(today),
                        marketplaceListingOnly()
                );

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    /**
     * 🎯 [추가] Pageable의 Sort 정보를 QueryDSL OrderSpecifier로 변환
     */
    private OrderSpecifier<?>[] getOrderSpecifiers(Sort sort) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();

        if (sort != null) {
            for (Sort.Order order : sort) {
                Order direction = order.isAscending() ? Order.ASC : Order.DESC;
                String property = order.getProperty();

                switch (property) {
                    case "budget":
                        orders.add(new OrderSpecifier<>(direction, project.budget));
                        break;
                    case "createdAt":
                    case "id":
                        orders.add(new OrderSpecifier<>(direction, project.createdAt));
                        break;
                    default:
                        // 기본 정렬 (등록일 최신순)
                        orders.add(new OrderSpecifier<>(Order.DESC, project.createdAt));
                        break;
                }
            }
        }

        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, project.createdAt));
        }

        return orders.toArray(new OrderSpecifier[0]);
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

    private BooleanExpression skillNamesAllMatch(List<String> skillNames) {
        if (skillNames == null || skillNames.isEmpty()) return null;

        List<String> cleanedNames = skillNames.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .map(String::toLowerCase)
                .distinct()
                .collect(Collectors.toList());

        if (cleanedNames.isEmpty()) return null;

        BooleanExpression expression = null;
        for (String name : cleanedNames) {
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

    private BooleanExpression budgetGoe(Long minBudget) {
        return minBudget != null ? project.budget.goe(minBudget) : null;
    }

    private BooleanExpression budgetLoe(Long maxBudget) {
        return maxBudget != null ? project.budget.loe(maxBudget) : null;
    }

    private BooleanExpression marketplaceListingOnly() {
        return project.listingKind.isNull().or(project.listingKind.eq(ProjectListingKind.MARKETPLACE));
    }
}
