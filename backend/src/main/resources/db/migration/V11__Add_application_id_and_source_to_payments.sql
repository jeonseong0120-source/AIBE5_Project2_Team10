-- V11: Add applicationId and source to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS application_id BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS source VARCHAR(20);
