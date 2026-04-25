-- ユーザーの論理削除カラムを追加する
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);
