-- Add location-related columns to projects table for offline project support
ALTER TABLE projects
ADD COLUMN location VARCHAR(500) NULL COMMENT '오프라인 근무지 주소',
ADD COLUMN latitude DOUBLE NULL COMMENT '위도',
ADD COLUMN longitude DOUBLE NULL COMMENT '경도';
