-- 프리랜서 소개글이 VARCHAR 등으로 짧게 잡혀 있으면 여러 줄 저장 시 실패할 수 있음
ALTER TABLE FreelancerProfile MODIFY COLUMN introduction LONGTEXT;
