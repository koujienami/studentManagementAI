ALTER TABLE courses
    DROP COLUMN IF EXISTS capacity,
    DROP COLUMN IF EXISTS status;

DROP INDEX IF EXISTS idx_courses_status;
