package com.devnear.web.domain.project;

import com.devnear.web.domain.enums.ProjectStatus;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import java.util.List;

import static com.devnear.web.domain.project.QProject.project;
import static io.jsonwebtoken.lang.Strings.hasText;

@RequiredArgsConstructor
public class ProjectRepositoryImpl implements ProjectRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Project> search(ProjectSearchCond cond, Pageable pageable) {
        List<Project> content = queryFactory
                .selectFrom(project)
                .leftJoin(project.clientProfile).fetchJoin()
                .where(
                        nameLike(cond.getKeyword()),
                        skillIn(cond.getSkillIds()),
                        locationContains(cond.getLocation()),
                        statusEq(cond.getStatus()),
                        isOnline(cond.getOnline()),
                        isOffline(cond.getOffline())
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
                        skillIn(cond.getSkillIds()),
                        locationContains(cond.getLocation()),
                        statusEq(cond.getStatus()),
                        isOnline(cond.getOnline()),
                        isOffline(cond.getOffline())
                );

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression nameLike(String keyword) {
        return hasText(keyword) ? project.projectName.contains(keyword) : null;
    }

    private BooleanExpression locationContains(String location) {
        return hasText(location) ? project.location.contains(location) : null;
    }

    private BooleanExpression skillIn(List<Long> skillIds) {
        if (skillIds == null || skillIds.isEmpty()) return null;
        return project.projectSkills.any().skill.id.in(skillIds);
    }

    private BooleanExpression statusEq(ProjectStatus status) {
        return status != null ? project.status.eq(status) : null;
    }

    private BooleanExpression isOnline(Boolean online) {
        return online != null ? project.online.eq(online) : null;
    }


    private BooleanExpression isOffline(Boolean offline) {
        return offline != null ? project.offline.eq(offline) : null;
    }
}