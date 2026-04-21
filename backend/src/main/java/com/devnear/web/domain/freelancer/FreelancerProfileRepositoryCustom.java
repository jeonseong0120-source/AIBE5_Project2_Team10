package com.devnear.web.domain.freelancer;

import com.devnear.web.domain.project.Project;
import com.querydsl.core.Tuple;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FreelancerProfileRepositoryCustom {

    /**
     * 프로젝트 요구 스택과 프리랜서의 보유 스택, 활동 지역(오프라인 여부 포함)을 기반으로
     * 가중치가 적용된 매칭 점수를 계산하여 적합한 프리랜서 목록을 반환합니다.
     * * 🎯 [수정됨] 반환 타입 변경: Page<FreelancerProfile> -> Page<Tuple>
     * Tuple 내부 구조:
     * - tuple.get(0, FreelancerProfile.class) : 프리랜서 엔티티
     * - tuple.get(1, Double.class) : 계산된 총 매칭 점수 (totalMatchingScore)
     */
    Page<Tuple> findOptimalFreelancersForProject(Project project, Pageable pageable);
}