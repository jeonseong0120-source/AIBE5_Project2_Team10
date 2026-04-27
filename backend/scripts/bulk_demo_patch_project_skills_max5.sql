-- =============================================================================
-- [패치] 벌크 데모 클라이언트 공고: project_skills 만 정리 (계정·공고 행은 유지)
--
-- ■ 스킬만 바꾸려면: 아래 "스킬 이름 설정" 블록의 @p1 ~ @p5 만 수정하세요.
--   (Skills / 스킬 마스터의 name 컬럼과 정확히 같아야 합니다.)
--
-- 실행: mysql -u ... -p DB_NAME < backend/scripts/bulk_demo_patch_project_skills_max5.sql
-- =============================================================================
SET NAMES utf8mb4;

-- ┌─────────────────────────────────────────────────────────────────────────
-- │ 스킬 이름 설정 — 이 다섯 줄만 수정하면 됩니다.
-- └─────────────────────────────────────────────────────────────────────────
SET @p1 = 'Java';
SET @p2 = 'Spring Boot';
SET @p3 = 'React';
SET @p4 = 'TypeScript';
SET @p5 = 'AWS';

START TRANSACTION;

SET @__prev_safe := @@SESSION.sql_safe_updates;
SET SESSION sql_safe_updates = 0;

DELETE ps
FROM project_skills ps
INNER JOIN projects p ON ps.project_id = p.project_id
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

INSERT INTO project_skills (project_id, skill_id)
SELECT p.project_id, s.skill_id
FROM projects p
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
INNER JOIN (
    SELECT @p1 AS skill_name
    UNION ALL SELECT @p2
    UNION ALL SELECT @p3
    UNION ALL SELECT @p4
    UNION ALL SELECT @p5
) t ON TRUE
INNER JOIN Skills s ON s.name = t.skill_name
WHERE u.email LIKE 'bulk-demo-client%@local.test';

SET SESSION sql_safe_updates = IFNULL(@__prev_safe, 1);

COMMIT;

-- 검증 (선택)
-- SELECT p.project_id, COUNT(*) cnt
-- FROM projects p
-- JOIN client_profile cp ON p.client_id = cp.client_id
-- JOIN users u ON cp.user_id = u.user_id
-- LEFT JOIN project_skills ps ON ps.project_id = p.project_id
-- WHERE u.email LIKE 'bulk-demo-client%@local.test'
-- GROUP BY p.project_id
-- HAVING cnt <> 5;
