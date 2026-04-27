-- =============================================================================
-- 벌크 데모 프리랜서: 프로필 직접 스킬(freelancer_skill) 제거 + 포트폴리오당 스킬 2개만(portfolio_skill)
--
-- ■ 스킬만 바꾸려면: 아래 "스킬 이름 설정" 블록의 네 변수만 수정하세요.
--   · 짝수 portfolio_id → @pf_even_1 , @pf_even_2
--   · 홀수 portfolio_id → @pf_odd_1 , @pf_odd_2
--   (Skills.name 과 정확히 같아야 합니다.)
--
-- 전제: users.email = bulk-demo-freelancer%@local.test
-- 실행: mysql -u ... -p DB_NAME < backend/scripts/bulk_demo_portfolio_skills_only.sql
-- 권장: mysql --abort-source-on-error -u ... -p DB_NAME < backend/scripts/bulk_demo_portfolio_skills_only.sql
--
-- 테이블명이 다르면 SHOW TABLES 로 확인 후 `Skills` 만 맞추면 됩니다.
-- =============================================================================
SET NAMES utf8mb4;

-- ┌─────────────────────────────────────────────────────────────────────────
-- │ 스킬 이름 설정 — 이 네 줄만 수정하면 됩니다.
-- └─────────────────────────────────────────────────────────────────────────
SET @pf_even_1 = 'Java';
SET @pf_even_2 = 'React';
SET @pf_odd_1 = 'Spring Boot';
SET @pf_odd_2 = 'TypeScript';

START TRANSACTION;

SET @__prev_safe := @@SESSION.sql_safe_updates;
SET SESSION sql_safe_updates = 0;

-- 스킬 이름 프리플라이트 검증: 각 변수는 Skills에서 정확히 1개 skill_id로 해석되어야 함
SET @cnt_pf_even_1 := (SELECT COUNT(*) FROM Skills s WHERE s.name = @pf_even_1);
SET @cnt_pf_even_2 := (SELECT COUNT(*) FROM Skills s WHERE s.name = @pf_even_2);
SET @cnt_pf_odd_1  := (SELECT COUNT(*) FROM Skills s WHERE s.name = @pf_odd_1);
SET @cnt_pf_odd_2  := (SELECT COUNT(*) FROM Skills s WHERE s.name = @pf_odd_2);

SET @preflight_error := CASE
    WHEN @cnt_pf_even_1 <> 1 THEN 'bulk_demo_portfolio_skills_only.sql: @pf_even_1 must resolve to exactly one Skills.skill_id'
    WHEN @cnt_pf_even_2 <> 1 THEN 'bulk_demo_portfolio_skills_only.sql: @pf_even_2 must resolve to exactly one Skills.skill_id'
    WHEN @cnt_pf_odd_1  <> 1 THEN 'bulk_demo_portfolio_skills_only.sql: @pf_odd_1 must resolve to exactly one Skills.skill_id'
    WHEN @cnt_pf_odd_2  <> 1 THEN 'bulk_demo_portfolio_skills_only.sql: @pf_odd_2 must resolve to exactly one Skills.skill_id'
    ELSE NULL
END;
SET @preflight_sql := IF(
    @preflight_error IS NULL,
    'DO 0',
    CONCAT('SIGNAL SQLSTATE ''45000'' SET MESSAGE_TEXT = ''',
           REPLACE(@preflight_error, '''', ''''''),
           '''')
);
PREPARE stmt_preflight FROM @preflight_sql;
EXECUTE stmt_preflight;
DEALLOCATE PREPARE stmt_preflight;

DELETE fs
FROM `FreelancerSkill` fs
INNER JOIN `FreelancerProfile` fp ON fs.freelancer_profile_id = fp.freelancer_profile_id
INNER JOIN users u ON fp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

DELETE ps
FROM `PortfolioSkill` ps
INNER JOIN `Portfolio` pf ON ps.portfolio_id = pf.portfolio_id
INNER JOIN users u ON pf.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

INSERT IGNORE INTO portfolio_skill (portfolio_id, skill_id)
SELECT pf.portfolio_id,
       (
           SELECT s.skill_id
           FROM Skills s
           WHERE s.name = IF(MOD(pf.portfolio_id, 2) = 0, @pf_even_1, @pf_odd_1)
           LIMIT 1
       ) AS skill_id
FROM portfolio pf
INNER JOIN users u ON pf.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

INSERT IGNORE INTO portfolio_skill (portfolio_id, skill_id)
SELECT pf.portfolio_id,
       (
           SELECT s.skill_id
           FROM Skills s
           WHERE s.name = IF(MOD(pf.portfolio_id, 2) = 0, @pf_even_2, @pf_odd_2)
           LIMIT 1
       ) AS skill_id
FROM portfolio pf
INNER JOIN users u ON pf.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

-- DemoBulkSeedService.syncFreelancerProfileSkillsFromPortfolios 와 동일한 방향:
-- 같은 유저의 portfolio_skill 합집합으로 freelancer_skill 재동기화
INSERT INTO freelancer_skill (freelancer_profile_id, skill_id)
SELECT DISTINCT fp.freelancer_profile_id, ps.skill_id
FROM freelancer_profile fp
INNER JOIN users u ON fp.user_id = u.user_id
INNER JOIN portfolio pf ON pf.user_id = u.user_id
INNER JOIN portfolio_skill ps ON ps.portfolio_id = pf.portfolio_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test'
  AND ps.skill_id IS NOT NULL;

SET SESSION sql_safe_updates = IFNULL(@__prev_safe, 1);

COMMIT;

-- 검증 (선택)
-- SELECT pf.portfolio_id, COUNT(*) AS cnt
-- FROM portfolio pf
-- INNER JOIN users u ON pf.user_id = u.user_id
-- LEFT JOIN portfolio_skill ps ON ps.portfolio_id = pf.portfolio_id
-- WHERE u.email LIKE 'bulk-demo-freelancer%@local.test'
-- GROUP BY pf.portfolio_id
-- HAVING cnt <> 2;
