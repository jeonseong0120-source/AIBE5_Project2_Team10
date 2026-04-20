-- Gemini 등록 텍스트 임베딩 저장 (JSON float 배열)
ALTER TABLE projects
    ADD COLUMN embedding_json LONGTEXT NULL COMMENT 'Gemini embedding as JSON number array',
    ADD COLUMN embedding_model VARCHAR(64) NULL,
    ADD COLUMN embedding_dimensions INT NULL;
