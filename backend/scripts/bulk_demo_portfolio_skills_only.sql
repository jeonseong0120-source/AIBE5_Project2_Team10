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

DELETE fs
FROM freelancer_skill fs
INNER JOIN freelancer_profile fp ON fs.freelancer_profile_id = fp.freelancer_profile_id
INNER JOIN users u ON fp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

DELETE ps
FROM portfolio_skill ps
INNER JOIN portfolio pf ON ps.portfolio_id = pf.portfolio_id
INNER JOIN users u ON pf.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

INSERT INTO portfolio_skill (portfolio_id, skill_id)
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

INSERT INTO portfolio_skill (portfolio_id, skill_id)
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
