-- hearing_tokens に updated_at を追加し、他テーブルと同様に自動更新トリガーを付与する
ALTER TABLE hearing_tokens
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

DROP TRIGGER IF EXISTS trigger_hearing_tokens_updated_at ON hearing_tokens;

CREATE TRIGGER trigger_hearing_tokens_updated_at
    BEFORE UPDATE ON hearing_tokens
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
