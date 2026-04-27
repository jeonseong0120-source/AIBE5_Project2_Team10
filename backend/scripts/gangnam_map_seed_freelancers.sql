-- =============================================================================
-- 강남 일대 맵용 프리랜서 약 10명 추가 (기존 벌크 데모 삭제 없이 단독 실행)
--
-- 생성 계정
--   이메일: gangnam-map-seed-01@local.test ~ gangnam-map-seed-10@local.test
--   비밀번호: 벌크 데모와 동일하게 쓰려면 아래 @pwd 가 bulk-demo-freelancer-01 에서 복사됨 → BulkDemo1!
--   provider: gangnam-map-seed (bulk-demo 와 구분)
--
-- 전제
--   * FreelancerGrade 에 이름 '일반' 행이 있음 (DataInitializer / 벌크 시드와 동일)
--   * users.password 는 BCrypt 등 앱과 동일한 인코딩
--
-- 실행: mysql -u ... -p DB_NAME < backend/scripts/gangnam_map_seed_freelancers.sql
--
-- 재실행: 이미 이메일이 있으면 users INSERT 가 스킵되고, 프로필만 없으면 프로필만 채움.
--         전부 지우고 다시 넣으려면 파일 하단 [롤백] 블록 주석 해제 후 실행.
-- =============================================================================
SET NAMES utf8mb4;

START TRANSACTION;

SET @__prev_safe := @@SESSION.sql_safe_updates;
SET SESSION sql_safe_updates = 0;

-- 동일 비번으로 로그인하려면: 이미 있는 벌크 프리랜서 한 명의 password 해시를 복사
SET @pwd := (
    SELECT u.password
    FROM users u
    WHERE u.email = 'bulk-demo-freelancer-01@local.test'
    LIMIT 1
);

-- 벌크 시드를 안 돌린 DB면 @pwd 가 NULL → 아래 중 하나로 채운 뒤 다시 실행
--   1) 앱에서 BulkDemo1! 로 가입한 유저 한 명의 password 를 SELECT 해서 복사
--   2) 또는 Spring BCrypt(10) 로 생성한 'BulkDemo1!' 해시를 직접 대입:
-- SET @pwd = '$2a$10$여기에_생성한_해시';

-- 포트폴리오에 붙일 기본 스킬 2개 (필요 시 이름만 변경)
SET @pf_skill_1 = 'Java';
SET @pf_skill_2 = 'React';

-- FreelancerGrade 테이블명 자동 감지 (대소문자/스네이크 케이스 대응)
SET @grade_table := CASE
    WHEN EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'FreelancerGrade'
    ) THEN '`FreelancerGrade`'
    WHEN EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'freelancer_grade'
    ) THEN 'freelancer_grade'
    ELSE NULL
END;

SET @grade_sql := IF(
    @grade_table IS NULL,
    'SELECT NULL INTO @grade_id',
    CONCAT(
        'SELECT freelancer_grade_id INTO @grade_id FROM ',
        @grade_table,
        ' WHERE name = ''일반'' LIMIT 1'
    )
);
PREPARE stmt_grade FROM @grade_sql;
EXECUTE stmt_grade;
DEALLOCATE PREPARE stmt_grade;

INSERT INTO users (
    email,
    password,
    name,
    nickname,
    phone_number,
    profile_image_url,
    role,
    status,
    provider,
    provider_id,
    notify_community_comments,
    created_at,
    updated_at
)
SELECT v.email,
       @pwd,
       v.name,
       v.nickname,
       v.phone_number,
       v.profile_image_url,
       'FREELANCER',
       'ACTIVE',
       'gangnam-map-seed',
       v.provider_id,
       TRUE,
       NOW(6),
       NOW(6)
FROM (
         SELECT 'gangnam-map-seed-01@local.test' AS email,
                '강남 맵 시드 01' AS name,
                'gnmap_fl_01' AS nickname,
                '01077000001' AS phone_number,
                'https://picsum.photos/seed/gangnam-map-01/400/400' AS profile_image_url,
                'gangnam-map-seed-01' AS provider_id
         UNION ALL
         SELECT 'gangnam-map-seed-02@local.test', '강남 맵 시드 02', 'gnmap_fl_02', '01077000002',
                'https://picsum.photos/seed/gangnam-map-02/400/400', 'gangnam-map-seed-02'
         UNION ALL
         SELECT 'gangnam-map-seed-03@local.test', '강남 맵 시드 03', 'gnmap_fl_03', '01077000003',
                'https://picsum.photos/seed/gangnam-map-03/400/400', 'gangnam-map-seed-03'
         UNION ALL
         SELECT 'gangnam-map-seed-04@local.test', '강남 맵 시드 04', 'gnmap_fl_04', '01077000004',
                'https://picsum.photos/seed/gangnam-map-04/400/400', 'gangnam-map-seed-04'
         UNION ALL
         SELECT 'gangnam-map-seed-05@local.test', '강남 맵 시드 05', 'gnmap_fl_05', '01077000005',
                'https://picsum.photos/seed/gangnam-map-05/400/400', 'gangnam-map-seed-05'
         UNION ALL
         SELECT 'gangnam-map-seed-06@local.test', '강남 맵 시드 06', 'gnmap_fl_06', '01077000006',
                'https://picsum.photos/seed/gangnam-map-06/400/400', 'gangnam-map-seed-06'
         UNION ALL
         SELECT 'gangnam-map-seed-07@local.test', '강남 맵 시드 07', 'gnmap_fl_07', '01077000007',
                'https://picsum.photos/seed/gangnam-map-07/400/400', 'gangnam-map-seed-07'
         UNION ALL
         SELECT 'gangnam-map-seed-08@local.test', '강남 맵 시드 08', 'gnmap_fl_08', '01077000008',
                'https://picsum.photos/seed/gangnam-map-08/400/400', 'gangnam-map-seed-08'
         UNION ALL
         SELECT 'gangnam-map-seed-09@local.test', '강남 맵 시드 09', 'gnmap_fl_09', '01077000009',
                'https://picsum.photos/seed/gangnam-map-09/400/400', 'gangnam-map-seed-09'
         UNION ALL
         SELECT 'gangnam-map-seed-10@local.test', '강남 맵 시드 10', 'gnmap_fl_10', '01077000010',
                'https://picsum.photos/seed/gangnam-map-10/400/400', 'gangnam-map-seed-10'
     ) v
WHERE @pwd IS NOT NULL
  AND @grade_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.email = v.email);

-- FreelancerProfile 테이블명 자동 감지 (대소문자/스네이크 케이스 대응)
SET @fp_table := CASE
    WHEN EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'FreelancerProfile'
    ) THEN '`FreelancerProfile`'
    WHEN EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'freelancer_profile'
    ) THEN 'freelancer_profile'
    ELSE NULL
END;

SET @fp_insert_sql := IF(
    @fp_table IS NULL,
    'SIGNAL SQLSTATE ''45000'' SET MESSAGE_TEXT = ''gangnam_map_seed_freelancers.sql: missing table FreelancerProfile/freelancer_profile''',
    CONCAT(
        'INSERT INTO ', @fp_table, ' (',
        'user_id, profile_image_url, introduction, location, latitude, longitude, hourly_rate, work_style, average_rating, review_count, completed_projects, is_active, balance, freelancer_grade_id, created_at, updated_at',
        ') ',
        'SELECT u.user_id, u.profile_image_url, ',
        'CONCAT(''맵 시드 전용: 강남 중심 좌표 분산 ('', u.email, ''). 원격/대면 협의 가능합니다.''), ',
        '''서울 강남'', g.lat, g.lng, 52000 + (MOD(u.user_id, 9) * 4000), ''HYBRID'', 0.0, 0, 0, TRUE, 0, @grade_id, NOW(6), NOW(6) ',
        'FROM users u INNER JOIN (',
        'SELECT ''gangnam-map-seed-01@local.test'' AS email, 37.5012 AS lat, 127.0244 AS lng ',
        'UNION ALL SELECT ''gangnam-map-seed-02@local.test'', 37.4961, 127.0312 ',
        'UNION ALL SELECT ''gangnam-map-seed-03@local.test'', 37.4993, 127.0238 ',
        'UNION ALL SELECT ''gangnam-map-seed-04@local.test'', 37.4968, 127.0295 ',
        'UNION ALL SELECT ''gangnam-map-seed-05@local.test'', 37.5020, 127.0279 ',
        'UNION ALL SELECT ''gangnam-map-seed-06@local.test'', 37.4945, 127.0266 ',
        'UNION ALL SELECT ''gangnam-map-seed-07@local.test'', 37.4988, 127.0304 ',
        'UNION ALL SELECT ''gangnam-map-seed-08@local.test'', 37.5004, 127.0251 ',
        'UNION ALL SELECT ''gangnam-map-seed-09@local.test'', 37.4939, 127.0283 ',
        'UNION ALL SELECT ''gangnam-map-seed-10@local.test'', 37.4975, 127.0219',
        ') g ON g.email = u.email ',
        'WHERE @grade_id IS NOT NULL ',
        'AND u.provider = ''gangnam-map-seed'' ',
        'AND NOT EXISTS (SELECT 1 FROM ', @fp_table, ' fp WHERE fp.user_id = u.user_id)'
    )
);
PREPARE stmt_fp_insert FROM @fp_insert_sql;
EXECUTE stmt_fp_insert;
DEALLOCATE PREPARE stmt_fp_insert;

-- Portfolio / PortfolioSkill / FreelancerSkill / Skills 테이블명 자동 감지
SET @pf_table := CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'Portfolio')
        THEN '`Portfolio`'
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'portfolio')
        THEN 'portfolio'
    ELSE NULL
END;

SET @ps_table := CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'PortfolioSkill')
        THEN '`PortfolioSkill`'
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'portfolio_skill')
        THEN 'portfolio_skill'
    ELSE NULL
END;

SET @fs_table := CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'FreelancerSkill')
        THEN '`FreelancerSkill`'
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'freelancer_skill')
        THEN 'freelancer_skill'
    ELSE NULL
END;

SET @skill_table := CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'Skills')
        THEN '`Skills`'
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'skills')
        THEN 'skills'
    ELSE NULL
END;

SET @sid_sql_1 := IF(
    @skill_table IS NULL,
    'SELECT NULL INTO @pf_skill_id_1',
    CONCAT('SELECT skill_id INTO @pf_skill_id_1 FROM ', @skill_table, ' WHERE name = ''', REPLACE(@pf_skill_1, '''', ''''''), ''' LIMIT 1')
);
PREPARE stmt_sid_1 FROM @sid_sql_1;
EXECUTE stmt_sid_1;
DEALLOCATE PREPARE stmt_sid_1;

SET @sid_sql_2 := IF(
    @skill_table IS NULL,
    'SELECT NULL INTO @pf_skill_id_2',
    CONCAT('SELECT skill_id INTO @pf_skill_id_2 FROM ', @skill_table, ' WHERE name = ''', REPLACE(@pf_skill_2, '''', ''''''), ''' LIMIT 1')
);
PREPARE stmt_sid_2 FROM @sid_sql_2;
EXECUTE stmt_sid_2;
DEALLOCATE PREPARE stmt_sid_2;

-- 목록 노출 조건(포트폴리오 1개 이상) 충족: 유저당 포트폴리오 1개 생성
SET @pf_insert_sql := IF(
    @pf_table IS NULL,
    'SIGNAL SQLSTATE ''45000'' SET MESSAGE_TEXT = ''gangnam_map_seed_freelancers.sql: missing table Portfolio/portfolio''',
    CONCAT(
        'INSERT INTO ', @pf_table, ' (user_id, title, description, thumbnail_url, created_at, updated_at) ',
        'SELECT u.user_id, CONCAT(''강남 맵 시드 포트폴리오 - '', LPAD(CAST(u.user_id % 100 AS CHAR), 2, ''0'')), ',
        '''강남권 프로젝트 수행 경험 요약 포트폴리오입니다. 지도/위치 기반 노출 테스트용 데이터입니다.'', ',
        'CONCAT(''https://picsum.photos/seed/gangnam-map-pf-'', CAST(u.user_id AS CHAR), ''/800/450''), ',
        'NOW(6), NOW(6) ',
        'FROM users u ',
        'WHERE u.provider = ''gangnam-map-seed'' ',
        'AND NOT EXISTS (SELECT 1 FROM ', @pf_table, ' pf WHERE pf.user_id = u.user_id)'
    )
);
PREPARE stmt_pf_insert FROM @pf_insert_sql;
EXECUTE stmt_pf_insert;
DEALLOCATE PREPARE stmt_pf_insert;

-- 포트폴리오 스킬 2개 부여 (중복 무시)
SET @ps_insert_sql_1 := IF(
    @ps_table IS NULL OR @pf_table IS NULL OR @pf_skill_id_1 IS NULL,
    'DO 0',
    CONCAT(
        'INSERT IGNORE INTO ', @ps_table, ' (portfolio_id, skill_id) ',
        'SELECT pf.portfolio_id, ', CAST(@pf_skill_id_1 AS CHAR), ' ',
        'FROM ', @pf_table, ' pf ',
        'INNER JOIN users u ON u.user_id = pf.user_id ',
        'WHERE u.provider = ''gangnam-map-seed'''
    )
);
PREPARE stmt_ps_insert_1 FROM @ps_insert_sql_1;
EXECUTE stmt_ps_insert_1;
DEALLOCATE PREPARE stmt_ps_insert_1;

SET @ps_insert_sql_2 := IF(
    @ps_table IS NULL OR @pf_table IS NULL OR @pf_skill_id_2 IS NULL,
    'DO 0',
    CONCAT(
        'INSERT IGNORE INTO ', @ps_table, ' (portfolio_id, skill_id) ',
        'SELECT pf.portfolio_id, ', CAST(@pf_skill_id_2 AS CHAR), ' ',
        'FROM ', @pf_table, ' pf ',
        'INNER JOIN users u ON u.user_id = pf.user_id ',
        'WHERE u.provider = ''gangnam-map-seed'''
    )
);
PREPARE stmt_ps_insert_2 FROM @ps_insert_sql_2;
EXECUTE stmt_ps_insert_2;
DEALLOCATE PREPARE stmt_ps_insert_2;

-- 프로필 스킬도 포트폴리오 기준으로 동기화 (필터/카드 태그 노출 보강)
SET @fs_delete_sql := IF(
    @fs_table IS NULL OR @fp_table IS NULL OR @pf_table IS NULL OR @ps_table IS NULL,
    'DO 0',
    CONCAT(
        'DELETE fs FROM ', @fs_table, ' fs ',
        'INNER JOIN ', @fp_table, ' fp ON fp.freelancer_profile_id = fs.freelancer_profile_id ',
        'INNER JOIN users u ON u.user_id = fp.user_id ',
        'WHERE u.provider = ''gangnam-map-seed'''
    )
);
PREPARE stmt_fs_delete FROM @fs_delete_sql;
EXECUTE stmt_fs_delete;
DEALLOCATE PREPARE stmt_fs_delete;

SET @fs_insert_sql := IF(
    @fs_table IS NULL OR @fp_table IS NULL OR @pf_table IS NULL OR @ps_table IS NULL,
    'DO 0',
    CONCAT(
        'INSERT IGNORE INTO ', @fs_table, ' (freelancer_profile_id, skill_id) ',
        'SELECT DISTINCT fp.freelancer_profile_id, ps.skill_id ',
        'FROM ', @fp_table, ' fp ',
        'INNER JOIN users u ON u.user_id = fp.user_id ',
        'INNER JOIN ', @pf_table, ' pf ON pf.user_id = u.user_id ',
        'INNER JOIN ', @ps_table, ' ps ON ps.portfolio_id = pf.portfolio_id ',
        'WHERE u.provider = ''gangnam-map-seed'''
    )
);
PREPARE stmt_fs_insert FROM @fs_insert_sql;
EXECUTE stmt_fs_insert;
DEALLOCATE PREPARE stmt_fs_insert;

SET SESSION sql_safe_updates = IFNULL(@__prev_safe, 1);

COMMIT;

-- =============================================================================
-- 검증 (선택)
-- =============================================================================
-- SELECT u.email, fp.latitude, fp.longitude, fp.location
-- FROM users u
-- JOIN `FreelancerProfile` fp ON fp.user_id = u.user_id
-- WHERE u.email LIKE 'gangnam-map-seed-%@local.test';

-- =============================================================================
-- [롤백] 이 시드만 제거할 때 (순서 유지: 프로필 → 유저)
-- =============================================================================
-- START TRANSACTION;
-- SET SESSION sql_safe_updates = 0;
-- DELETE fp FROM `FreelancerProfile` fp
-- INNER JOIN users u ON fp.user_id = u.user_id
-- WHERE u.provider = 'gangnam-map-seed';
-- DELETE FROM users WHERE provider = 'gangnam-map-seed';
-- COMMIT;
