-- 申込経路マスタを管理画面で扱えるよう、表示順と論理削除カラムを追加する
ALTER TABLE referral_sources
    ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

ALTER TABLE referral_sources
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- 既存データに id 順で表示順を振る（display_order が 0 のままのものだけ）
UPDATE referral_sources
SET display_order = id
WHERE display_order = 0;

CREATE INDEX IF NOT EXISTS idx_referral_sources_deleted_at
    ON referral_sources (deleted_at);
