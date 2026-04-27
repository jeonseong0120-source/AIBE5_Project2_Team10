-- =============================================================================
-- 벌크 데모 커뮤니티 시드 (게시글 + 댓글 + 좋아요)
--
-- 전제:
--   1) bulk-demo-client-XX@local.test / bulk-demo-freelancer-XX@local.test 유저가 이미 존재해야 함
--   2) 재실행 시 [BULK-COMMUNITY] 마커 글만 지우고 다시 생성함 (idempotent)
--
-- 실행:
--   mysql --abort-source-on-error -u ... -p DB_NAME < backend/scripts/bulk_demo_community_seed.sql
-- =============================================================================
SET NAMES utf8mb4;

START TRANSACTION;

SET @__prev_safe := @@SESSION.sql_safe_updates;
SET SESSION sql_safe_updates = 0;

-- ┌─────────────────────────────────────────────────────────────────────────
-- │ 작성자/참여자 이메일 설정 (필요 시 여기만 수정)
-- └─────────────────────────────────────────────────────────────────────────
SET @author_client_1 = 'bulk-demo-client-01@local.test';
SET @author_client_2 = 'bulk-demo-client-02@local.test';
SET @author_free_1   = 'bulk-demo-freelancer-01@local.test';
SET @author_free_2   = 'bulk-demo-freelancer-02@local.test';
SET @author_free_3   = 'bulk-demo-freelancer-03@local.test';
SET @author_free_4   = 'bulk-demo-freelancer-04@local.test';

SET @marker = '[BULK-COMMUNITY]';

-- 사전 검증: 각 이메일은 users에서 정확히 1건이어야 함
SET @cnt_client_1 := (SELECT COUNT(*) FROM users WHERE email = @author_client_1);
SET @cnt_client_2 := (SELECT COUNT(*) FROM users WHERE email = @author_client_2);
SET @cnt_free_1   := (SELECT COUNT(*) FROM users WHERE email = @author_free_1);
SET @cnt_free_2   := (SELECT COUNT(*) FROM users WHERE email = @author_free_2);
SET @cnt_free_3   := (SELECT COUNT(*) FROM users WHERE email = @author_free_3);
SET @cnt_free_4   := (SELECT COUNT(*) FROM users WHERE email = @author_free_4);

SET @preflight_error := CASE
    WHEN @cnt_client_1 <> 1 THEN 'bulk_demo_community_seed.sql: missing/duplicate users row for @author_client_1'
    WHEN @cnt_client_2 <> 1 THEN 'bulk_demo_community_seed.sql: missing/duplicate users row for @author_client_2'
    WHEN @cnt_free_1   <> 1 THEN 'bulk_demo_community_seed.sql: missing/duplicate users row for @author_free_1'
    WHEN @cnt_free_2   <> 1 THEN 'bulk_demo_community_seed.sql: missing/duplicate users row for @author_free_2'
    WHEN @cnt_free_3   <> 1 THEN 'bulk_demo_community_seed.sql: missing/duplicate users row for @author_free_3'
    WHEN @cnt_free_4   <> 1 THEN 'bulk_demo_community_seed.sql: missing/duplicate users row for @author_free_4'
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

-- 기존 마커 데이터 정리(재실행 안전)
DELETE c
FROM community_comments c
INNER JOIN community_posts p ON p.post_id = c.post_id
WHERE p.title LIKE CONCAT(@marker, '%');

DELETE l
FROM community_post_likes l
INNER JOIN community_posts p ON p.post_id = l.post_id
WHERE p.title LIKE CONCAT(@marker, '%');

DELETE p
FROM community_posts p
WHERE p.title LIKE CONCAT(@marker, '%');

-- 게시글 6건 생성
INSERT INTO community_posts (title, content, author_id, view_count, like_count, comment_count, created_at, updated_at)
SELECT src.title, src.content, u.user_id, src.view_count, 0, 0, src.created_at, src.created_at
FROM (
    SELECT @author_client_1 AS email,
           CONCAT(@marker, ' 외주 시작 전에 계약서에서 꼭 확인할 항목') AS title,
           '프로젝트 시작 전 범위(Scope), 산출물 기준, 수정 횟수, 지연 책임, 중도 해지 조항을 어떻게 명시하시나요? 실제로 분쟁 줄이는 문구가 있다면 공유 부탁드립니다.' AS content,
           147 AS view_count,
           DATE_SUB(NOW(), INTERVAL 11 DAY) AS created_at
    UNION ALL
    SELECT @author_free_1,
           CONCAT(@marker, ' React + TypeScript 협업 시 코드리뷰 룰 추천'),
           '팀 생산성을 위해 PR 템플릿과 리뷰 체크리스트를 맞추고 싶습니다. 네이밍, 상태관리, 컴포넌트 분리 기준을 어떻게 두는지 궁금해요.',
           211,
           DATE_SUB(NOW(), INTERVAL 9 DAY)
    UNION ALL
    SELECT @author_client_2,
           CONCAT(@marker, ' MySQL 인덱스 튜닝 경험자 찾습니다'),
           '조회가 많은 관리자 화면에서 응답이 느려져 인덱스 재설계를 검토 중입니다. 복합 인덱스 설계와 실행계획 기반 개선 경험 있으신 분 계실까요?',
           188,
           DATE_SUB(NOW(), INTERVAL 8 DAY)
    UNION ALL
    SELECT @author_free_2,
           CONCAT(@marker, ' 포트폴리오 기술스택 정리 팁 공유'),
           '포트폴리오 설명에 기술을 너무 많이 넣으면 오히려 전달력이 떨어지더라고요. 프로젝트별 핵심 스택을 간결하게 보여주는 방법이 있을까요?',
           126,
           DATE_SUB(NOW(), INTERVAL 6 DAY)
    UNION ALL
    SELECT @author_free_3,
           CONCAT(@marker, ' Figma 핸드오프 시 개발자가 꼭 보는 포인트'),
           '디자인 시스템 토큰, 컴포넌트 상태, 반응형 기준점을 어떤 순서로 정리하면 개발 전환이 덜 꼬이는지 궁금합니다.',
           173,
           DATE_SUB(NOW(), INTERVAL 4 DAY)
    UNION ALL
    SELECT @author_free_4,
           CONCAT(@marker, ' 배포 자동화(GitHub Actions) 최소 구성 질문'),
           '테스트-빌드-배포를 분리하려고 합니다. 초기에는 어떤 단계부터 자동화하면 가장 효과적이었는지 경험담 부탁드립니다.',
           159,
           DATE_SUB(NOW(), INTERVAL 2 DAY)
) src
INNER JOIN users u ON u.email = src.email;

-- 좋아요 생성 (중복 방지)
INSERT IGNORE INTO community_post_likes (post_id, user_id)
SELECT p.post_id, u.user_id
FROM community_posts p
INNER JOIN users u ON u.email IN (@author_free_1, @author_free_2, @author_free_3)
WHERE p.title = CONCAT(@marker, ' 외주 시작 전에 계약서에서 꼭 확인할 항목');

INSERT IGNORE INTO community_post_likes (post_id, user_id)
SELECT p.post_id, u.user_id
FROM community_posts p
INNER JOIN users u ON u.email IN (@author_client_1, @author_free_2, @author_free_4)
WHERE p.title = CONCAT(@marker, ' React + TypeScript 협업 시 코드리뷰 룰 추천');

INSERT IGNORE INTO community_post_likes (post_id, user_id)
SELECT p.post_id, u.user_id
FROM community_posts p
INNER JOIN users u ON u.email IN (@author_client_1, @author_free_1)
WHERE p.title = CONCAT(@marker, ' MySQL 인덱스 튜닝 경험자 찾습니다');

INSERT IGNORE INTO community_post_likes (post_id, user_id)
SELECT p.post_id, u.user_id
FROM community_posts p
INNER JOIN users u ON u.email IN (@author_client_2, @author_free_3, @author_free_4)
WHERE p.title = CONCAT(@marker, ' Figma 핸드오프 시 개발자가 꼭 보는 포인트');

-- 댓글 생성
INSERT INTO community_comments (post_id, author_id, content, created_at, updated_at)
SELECT p.post_id, u.user_id,
       '좋은 포인트네요. 저희는 착수 전에 산출물 정의를 체크리스트로 고정하고 있습니다.',
       DATE_ADD(p.created_at, INTERVAL 3 HOUR),
       DATE_ADD(p.created_at, INTERVAL 3 HOUR)
FROM community_posts p
INNER JOIN users u ON u.email = @author_free_2
WHERE p.title = CONCAT(@marker, ' 외주 시작 전에 계약서에서 꼭 확인할 항목');

INSERT INTO community_comments (post_id, author_id, content, created_at, updated_at)
SELECT p.post_id, u.user_id,
       'PR 템플릿에 테스트 범위와 리스크를 꼭 쓰게 했더니 리뷰 속도가 많이 빨라졌습니다.',
       DATE_ADD(p.created_at, INTERVAL 5 HOUR),
       DATE_ADD(p.created_at, INTERVAL 5 HOUR)
FROM community_posts p
INNER JOIN users u ON u.email = @author_client_2
WHERE p.title = CONCAT(@marker, ' React + TypeScript 협업 시 코드리뷰 룰 추천');

INSERT INTO community_comments (post_id, author_id, content, created_at, updated_at)
SELECT p.post_id, u.user_id,
       '실행계획 먼저 확인하시고 where + order by 기준으로 인덱스 순서를 맞추면 체감이 큽니다.',
       DATE_ADD(p.created_at, INTERVAL 2 HOUR),
       DATE_ADD(p.created_at, INTERVAL 2 HOUR)
FROM community_posts p
INNER JOIN users u ON u.email = @author_free_1
WHERE p.title = CONCAT(@marker, ' MySQL 인덱스 튜닝 경험자 찾습니다');

INSERT INTO community_comments (post_id, author_id, content, created_at, updated_at)
SELECT p.post_id, u.user_id,
       '저는 프로젝트마다 핵심 3개 기술만 본문 상단에 고정해 두는 방식이 제일 반응이 좋았습니다.',
       DATE_ADD(p.created_at, INTERVAL 4 HOUR),
       DATE_ADD(p.created_at, INTERVAL 4 HOUR)
FROM community_posts p
INNER JOIN users u ON u.email = @author_free_3
WHERE p.title = CONCAT(@marker, ' 포트폴리오 기술스택 정리 팁 공유');

INSERT INTO community_comments (post_id, author_id, content, created_at, updated_at)
SELECT p.post_id, u.user_id,
       '디자인 토큰과 상태(hover, disabled, error) 명세를 먼저 합의하면 핸드오프가 훨씬 수월했습니다.',
       DATE_ADD(p.created_at, INTERVAL 1 HOUR),
       DATE_ADD(p.created_at, INTERVAL 1 HOUR)
FROM community_posts p
INNER JOIN users u ON u.email = @author_client_1
WHERE p.title = CONCAT(@marker, ' Figma 핸드오프 시 개발자가 꼭 보는 포인트');

-- 카운트 동기화 (서비스 로직과 동일하게 실제 행 기준으로 보정)
UPDATE community_posts p
LEFT JOIN (
    SELECT post_id, COUNT(*) AS like_cnt
    FROM community_post_likes
    GROUP BY post_id
) l ON l.post_id = p.post_id
LEFT JOIN (
    SELECT post_id, COUNT(*) AS comment_cnt
    FROM community_comments
    GROUP BY post_id
) c ON c.post_id = p.post_id
SET p.like_count = IFNULL(l.like_cnt, 0),
    p.comment_count = IFNULL(c.comment_cnt, 0)
WHERE p.title LIKE CONCAT(@marker, '%');

SET SESSION sql_safe_updates = IFNULL(@__prev_safe, 1);
COMMIT;

-- 검증 (선택)
-- SELECT post_id, title, author_id, view_count, like_count, comment_count, created_at
-- FROM community_posts
-- WHERE title LIKE '[BULK-COMMUNITY]%'
-- ORDER BY post_id DESC;
