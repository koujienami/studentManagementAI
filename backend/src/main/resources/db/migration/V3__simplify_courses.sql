-- 既存の開発DBを baseline-on-migrate で引き継ぐ際に、
-- 旧 schema.sql 由来の courses.capacity / courses.status を除去する。
ALTER TABLE courses
    DROP COLUMN IF EXISTS capacity,
    DROP COLUMN IF EXISTS status;

DROP INDEX IF EXISTS idx_courses_status;
