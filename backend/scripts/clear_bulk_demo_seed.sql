-- =============================================================================
-- 벌크 데모 시드 데이터 삭제 (DemoBulkSeedService 가 넣은 행)
-- 대상: users.email 이 'bulk-demo-%@local.test' 패턴인 계정과,
--       벌크 데모 클라이언트 공고 / 벌크 데모 프리랜서(지원·채팅·매칭 등)에 매달린 자식 행
-- 실행: mysql -u ... -p DB_NAME < backend/scripts/clear_bulk_demo_seed.sql
--
-- MySQL Workbench 등에서 Error 1175 (safe update mode) 가 나면 아래 SET 이 세션에서만 끕니다.
-- (Preferences → SQL Editor → Safe Updates 를 끄는 것과 동일한 효과, 이 파일만으로 해결)
--
-- 테이블명: ddl-auto 로 생긴 DB는 보통 스네이크 케이스(freelancer_profile, portfolio 등)입니다.
-- SHOW TABLES 로 실제 이름을 확인한 뒤, 엔티티 @Table 과 다르면 이 스크립트의 테이블명만 바꿔 주세요.
-- =============================================================================
SET NAMES utf8mb4;

START TRANSACTION;

SET @__bulk_demo_seed_prev_safe := @@SESSION.sql_safe_updates;
SET SESSION sql_safe_updates = 0;

-- 벌크 데모 클라이언트 공고에 매칭된 프리랜서 FK 해제 (다른 프로필 삭제 전)
UPDATE projects p
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
SET p.freelancer_id = NULL
WHERE u.email LIKE 'bulk-demo-client%@local.test';

-- 벌크 데모 프리랜서가 매칭된 공고 전역 FK 해제 (projects.freelancer_id → freelancer_profile_id, user_id 아님)
UPDATE projects p
INNER JOIN freelancer_profile fp ON p.freelancer_id = fp.freelancer_profile_id
INNER JOIN users u ON fp.user_id = u.user_id
SET p.freelancer_id = NULL
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

-- 채팅 (공고 = 벌크 데모 클라이언트 소유)
DELETE cm FROM chat_messages cm
INNER JOIN chat_rooms cr ON cm.chat_room_id = cr.chat_room_id
INNER JOIN projects p ON cr.project_id = p.project_id
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

DELETE cr FROM chat_rooms cr
INNER JOIN projects p ON cr.project_id = p.project_id
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

-- 지원 / 역제안 / 북마크 (공고 기준)
DELETE a FROM applications a
INNER JOIN projects p ON a.project_id = p.project_id
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

DELETE pr FROM proposals pr
INNER JOIN projects p ON pr.project_id = p.project_id
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

DELETE b FROM bookmarks_project b
INNER JOIN projects p ON b.project_id = p.project_id
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

-- 벌크 데모 프리랜서가 북마크한 모든 공고
DELETE b FROM bookmarks_project b
INNER JOIN freelancer_profile fp ON b.freelancer_profile_id = fp.freelancer_profile_id
INNER JOIN users u ON fp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

-- 지원/역제안: 벌크 데모 프리랜서가 지원·제안받은 행 (공고가 데모 클라이언트 소유가 아니어도 삭제)
DELETE a FROM applications a
INNER JOIN freelancer_profile fp ON a.freelancer_id = fp.freelancer_profile_id
INNER JOIN users u ON fp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

DELETE pr FROM proposals pr
INNER JOIN freelancer_profile fp ON pr.freelancer_id = fp.freelancer_profile_id
INNER JOIN users u ON fp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

-- 채팅: 벌크 데모 프리랜서 유저가 참가한 방 (user1_id / user2_id → users)
DELETE cm FROM chat_messages cm
INNER JOIN chat_rooms cr ON cm.chat_room_id = cr.chat_room_id
LEFT JOIN users u1 ON cr.user1_id = u1.user_id
LEFT JOIN users u2 ON cr.user2_id = u2.user_id
WHERE u1.email LIKE 'bulk-demo-freelancer%@local.test'
   OR u2.email LIKE 'bulk-demo-freelancer%@local.test';

DELETE cr FROM chat_rooms cr
INNER JOIN users u1 ON cr.user1_id = u1.user_id
WHERE u1.email LIKE 'bulk-demo-freelancer%@local.test';

DELETE cr FROM chat_rooms cr
INNER JOIN users u2 ON cr.user2_id = u2.user_id
WHERE u2.email LIKE 'bulk-demo-freelancer%@local.test';

-- 클라이언트가 벌크 데모 프리랜서를 북마크한 내역
DELETE bf FROM bookmarks_freelancer bf
INNER JOIN freelancer_profile fp ON bf.freelancer_profile_id = fp.freelancer_profile_id
INNER JOIN users u ON fp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

-- 리뷰 (프로젝트 id 또는 참여자가 벌크 데모)
DELETE fr FROM freelancer_review fr
INNER JOIN projects p ON fr.project_id = p.project_id
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

DELETE fr FROM freelancer_review fr
INNER JOIN freelancer_profile fp ON fr.freelancer_id = fp.freelancer_profile_id
INNER JOIN users u ON fp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

DELETE fr FROM freelancer_review fr
INNER JOIN client_profile cp ON fr.reviewer_client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

DELETE cr FROM client_review cr
INNER JOIN projects p ON cr.project_id = p.project_id
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

DELETE cr FROM client_review cr
INNER JOIN client_profile cp ON cr.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

DELETE cr FROM client_review cr
INNER JOIN freelancer_profile fp ON cr.reviewer_freelancer_id = fp.freelancer_profile_id
INNER JOIN users u ON fp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

DELETE ps FROM project_skills ps
INNER JOIN projects p ON ps.project_id = p.project_id
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

DELETE p FROM projects p
INNER JOIN client_profile cp ON p.client_id = cp.client_id
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

-- 커뮤니티 (벌크 데모 유저가 작성한 글 / 댓글 / 좋아요)
DELETE c FROM community_comments c
INNER JOIN community_posts po ON c.post_id = po.post_id
INNER JOIN users u ON po.author_id = u.user_id
WHERE u.email LIKE 'bulk-demo-%@local.test';

DELETE pl FROM community_post_likes pl
INNER JOIN community_posts po ON pl.post_id = po.post_id
INNER JOIN users u ON po.author_id = u.user_id
WHERE u.email LIKE 'bulk-demo-%@local.test';

DELETE pl FROM community_post_likes pl
INNER JOIN users u ON pl.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-%@local.test';

DELETE c FROM community_comments c
INNER JOIN users u ON c.author_id = u.user_id
WHERE u.email LIKE 'bulk-demo-%@local.test';

DELETE po FROM community_posts po
INNER JOIN users u ON po.author_id = u.user_id
WHERE u.email LIKE 'bulk-demo-%@local.test';

-- 포트폴리오 (벌크 데모 프리랜서)
DELETE pi FROM portfolio_image pi
INNER JOIN portfolio pf ON pi.portfolio_id = pf.portfolio_id
INNER JOIN users u ON pf.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

DELETE ps FROM portfolio_skill ps
INNER JOIN portfolio pf ON ps.portfolio_id = pf.portfolio_id
INNER JOIN users u ON pf.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

DELETE pf FROM portfolio pf
INNER JOIN users u ON pf.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

-- 알림
DELETE n FROM notifications n
INNER JOIN users u ON n.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-%@local.test';

-- 프로필 (User 보다 먼저)
DELETE fs FROM freelancer_skill fs
INNER JOIN freelancer_profile fp ON fs.freelancer_profile_id = fp.freelancer_profile_id
INNER JOIN users u ON fp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

DELETE cp FROM client_profile cp
INNER JOIN users u ON cp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-client%@local.test';

DELETE fp FROM freelancer_profile fp
INNER JOIN users u ON fp.user_id = u.user_id
WHERE u.email LIKE 'bulk-demo-freelancer%@local.test';

DELETE FROM users
WHERE email LIKE 'bulk-demo-%@local.test';

SET SESSION sql_safe_updates = IFNULL(@__bulk_demo_seed_prev_safe, 1);

COMMIT;
