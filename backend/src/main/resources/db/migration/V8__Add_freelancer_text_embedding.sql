-- Freelancer 프로필/포트폴리오 기반 임베딩 저장 (JSON float 배열)
ALTER TABLE freelancer_profile
    ADD COLUMN embedding_json LONGTEXT NULL COMMENT 'Freelancer embedding as JSON number array',
    ADD COLUMN embedding_model VARCHAR(64) NULL,
    ADD COLUMN embedding_dimensions INT NULL;

