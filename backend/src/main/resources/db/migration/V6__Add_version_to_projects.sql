-- 낙관적 락용 버전 컬럼 (Project 엔티티 @Version)
ALTER TABLE projects
ADD COLUMN version BIGINT NOT NULL DEFAULT 0 COMMENT 'JPA optimistic lock version';
